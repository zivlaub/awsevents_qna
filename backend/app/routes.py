from fastapi import APIRouter
import os
import openai
import numpy as np
from app.schemas import query, search_response, chat_response, health_response
import app.exceptions as exceptions
from fastapi import Request
import logging
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain import PromptTemplate, OpenAI, LLMChain, SagemakerEndpoint
from langchain.llms.bedrock import Bedrock
from langchain.embeddings.bedrock import BedrockEmbeddings
from datetime import datetime
from pydantic import Extra, root_validator
from typing import Any, Dict, Generic, List, Mapping, Optional, TypeVar, Union
from langchain.llms.sagemaker_endpoint import LLMContentHandler
import json

class ContentHandler(LLMContentHandler):
    content_type = "application/json"
    accepts = "application/json"

    def transform_input(self, prompt: str, model_kwargs: Dict) -> bytes:

        payload = {
                "inputs": prompt,
                "parameters": model_kwargs
        }
        input_str = json.dumps(payload)
        return input_str.encode("utf-8")

    def transform_output(self, output: bytes) -> str:
        response_json = json.loads(output.read().decode("utf-8"))
        return response_json[0]["generated_text"]





class SagemakerEndpointWithClient(SagemakerEndpoint):
    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
    @root_validator()
    def validate_environment(cls, values: Dict) -> Dict:
        """Validate that AWS credentials to and python package exists in environment."""
        print(f'SagemakerEndpointWithClient.validate_environment. Client:{values["client"]}')
        if values["client"] is not None:
            return values

        try:
            import boto3

            try:
                if values["credentials_profile_name"] is not None:
                    session = boto3.Session(
                        profile_name=values["credentials_profile_name"]
                    )
                else:
                    # use default credentials
                    session = boto3.Session()

                values["client"] = session.client(
                    "sagemaker-runtime", region_name=values["region_name"]
                )

            except Exception as e:
                raise ValueError(
                    "Could not load credentials to authenticate with AWS client. "
                    "Please check that credentials in the specified "
                    "profile name are valid."
                ) from e

        except ImportError:
            raise ImportError(
                "Could not import boto3 python package. "
                "Please install it with `pip install boto3`."
            )
        return values


USE_LANG_CHAIN = True

router = APIRouter()
_logger = logging.getLogger(__name__)

@router.get(
    "/health",
    response_model=health_response,
    summary="health API",
    response_description="",
)
async def health_handler(request: Request):
    _logger.info({"message": "Calling health endpoint"})
    return health_response(status='OK')

last_bedrock_client_creation = datetime.min
bedrock_client = None
last_sagemaker_client_creation = datetime.min
sagemaker_client = None


def ensure_bedrock_client(region_name: str):
    global last_bedrock_client_creation
    global bedrock_client
    now_datetime =  datetime.now()
    delta = now_datetime - last_bedrock_client_creation
    if delta.total_seconds() > 600:
        import boto3
        role_arn = 'arn:aws:iam::114798159153:role/service-role/AmazonSageMaker-ExecutionRole-20230604T083841' # <---- put the role from the Bedrock account here
        session_name = 'demo'
        region = 'us-east-1'
        external_id = 'eitans' # <---- put the cross-account role external ID here.

        # Assume the role
        sts_client = boto3.client('sts', region_name=region)
        response = sts_client.assume_role(
            RoleArn=role_arn,
            RoleSessionName=session_name,
            ExternalId=external_id
        )

        # Create a new session using the assumed role credentials
        session = boto3.Session(
            aws_access_key_id=response['Credentials']['AccessKeyId'],
            aws_secret_access_key=response['Credentials']['SecretAccessKey'],
            aws_session_token=response['Credentials']['SessionToken'],
            region_name=region
        )
        client_params = {}
        client_params["region_name"] = region_name
        #bedrock_client = session.client("bedrock", **client_params)
        bedrock_client = session.client(service_name='bedrock',region_name=region_name,endpoint_url='https://bedrock.us-east-1.amazonaws.com')
        last_bedrock_client_creation = now_datetime
        print('bedrock_client created')

def ensure_sagemaker_client(region_name: str):
    import boto3
    global last_sagemaker_client_creation
    global sagemaker_client
    now_datetime =  datetime.now()
    delta = now_datetime - last_sagemaker_client_creation
    if delta.total_seconds() > 600:
        sagemaker_client = boto3.Session().client('sagemaker-runtime')
        last_sagemaker_client_creation = now_datetime
    print('sagemaker_client created')

def get_model(backend: str):
    if 'falcon-16b-instruct' in backend:
        return 'falcon-16b-instruct', 'jumpstart-dft-hf-llm-falcon-7b-instruct-bf16'
    raise Exception(f"model not supported: {backend}")

def chat_completion(query: query, docs):
    if USE_LANG_CHAIN:
        _logger.info(f"using LangChain.")
        from langchain.chains.question_answering import load_qa_chain
        prompt_template = """Please answer the following IMPORTANT PROMPT truthfully and as accurately as possible. 
                Use the following sources (which shall be denoted with a SOURCE TITLE and SOURCE CONTENT). 
                Try to not directly copy the sources word-for-word. Remember, you help developers with their questions 
                about the AWS documentation and TRY TO USE THE SOURCES AS CONTEXT to the best of your ability. However, you want to
                mainly focus on answering the user prompt. Do not randomly use the sources that have nothing to
                do with the question asked by the user. You do not have to explicity
                mention the source names and which sources you used in your answer.
                AGAIN PLEASE MAKE THE RESPONSE A {sentences} {sentences} {sentences} LENGTH THIS IS VERY IMPORTANT!!!\n\n
                Here is the IMPORTANT PROMPT: {question} \n\n Here are the SOURCES: \n\n{context}"""
                #Here is the IMPORTANT PROMPT: {question} \n\n Here are the SOURCES: \n\n"""
        
        if query.system_prompt is not None and len(query.system_prompt)>0:
            print(f'Custom system prompt: {query.system_prompt}')
            prompt_template = query.system_prompt
       
        context = ""
        for doc in docs:
            dic = dict(doc)
            context += "SOURCE TITLE: " + dic["page_title"] + "\n"
            context += "SOURCE CONTENT: " + dic["content"]
        
        #prompt_template += context
        _logger.info({"message": f"context:{context}"})
        _logger.info({"message": f"prompt_template:{prompt_template}"})
        imput_vars = ["question", 'context']
        if 'sentences' in prompt_template:
            imput_vars.append('sentences')

        prompt = PromptTemplate(
            template=prompt_template, input_variables=imput_vars
        )
        print(f'query.backend: {query.backend}')
        if 'openai' in query.backend:
            model = query.backend.replace('openai.','')
            llm = OpenAI(
                model_name=model,#"gpt-3.5-turbo", # default model
                temperature=0.9
            ) 
        elif 'bedrock' in query.backend:
            ensure_bedrock_client('us-east-1')
            model = query.backend.replace('bedrock.','')
            llm = Bedrock(client=bedrock_client, model_id=model)   
        elif 'sagemaker' in query.backend:
            model, parsed_endpoint_name = get_model(query.backend)
            ensure_sagemaker_client('us-east-1')
            print(f'parsed_endpoint_name: {parsed_endpoint_name}')
            content_handler = ContentHandler()
            region_name="us-east-1"
            model_kwargs={
                "do_sample": True,
                "top_p": 0.1,
                "temperature": 0.1,
                "max_new_tokens": 512,
                "top_k": 1,
                "stop": ["<|endoftext|>", "</s>"],
                }
           
            
            llm = SagemakerEndpointWithClient(endpoint_name=parsed_endpoint_name,client=sagemaker_client, 
                                              region_name=region_name,
                                              model_kwargs=model_kwargs,
                                              content_handler=content_handler)
            
        llmchain = LLMChain(llm=llm, prompt=prompt)
       
        answer = llmchain({"question": query.prompt, "sentences": query.sentences.upper(), "context": context})
        _logger.info(f"answer received from llm,\nquestion: \"{query.prompt}\"\nanswer: \"{answer}\"")
        #reply = f'reply from {model}:\n{answer["text"]}'
        reply = f'{answer["text"]}'
        return reply
    else:
        _logger.info(f"using OpenAI direct API")
        content = (
        f"""Please answer the following IMPORTANT PROMPT truthfully and as accurately as possible. 
                Use the following sources (which shall be denoted with a SOURCE TITLE and SOURCE CONTENT). 
                Try to not directly copy the sources word-for-word. Remember, you help developers with their questions 
                about the AWS documentation and TRY TO USE THE SOURCES AS CONTEXT to the best of your ability. However, you want to
                mainly focus on answering the user prompt. Do not randomly use the sources that have nothing to
                do with the question asked by the user. You do not have to explicity
                mention the source names and which sources you used in your answer.
                AGAIN PLEASE MAKE THE RESPONSE A {query.sentences.upper()} {query.sentences.upper()} {query.sentences.upper()} LENGTH THIS IS VERY IMPORTANT!!!
                
                Here is the IMPORTANT PROMPT: """
        + query.prompt
        + "\n\n Here are the SOURCES: \n\n"
        )
        for doc in docs:
            dic = dict(doc)
            #pages.append(dic)
            content += "SOURCE TITLE: " + dic["page_title"] + "\n"
            content += "SOURCE CONTENT: " + dic["content"]

        messages = [
            {
                "role": "system",
                "content": f"""You are a helpful and concise assistant that helps developers with their questions about the AWS documentation. 
                        In your responses, when you want to include a header, include it like: # [your header].
                        when you want to include a sub-header, include it like: ## [your sub-header].
                        when you want to include a piece of code, include it like: ```[your entire code bit]```.
                        For bold text, just render it like **bold text**. Render ordered/unordered lists in Markdown. 
                        For links, render as [link title](https://www.example.com).
                        Essentially just give your entire response as a Markdown document.
                        PLEASE MAKE THE RESPONSE A {query.sentences.upper()} {query.sentences.upper()} {query.sentences.upper()} LENGTH THIS IS VERY IMPORTANT!!!
                        If you are giving a SHORT or MEDIUM response, do not add a long response with [Answer] or an "Answer" heading. 
                        Always try to keep track of your response length especially before you give the response.""",
            },
            {"role": "user", "content": content},
        ]
        res = openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=messages)
        reply = res["choices"][0]["message"]["content"]
        return reply


 
@router.post(
    "/search",
    response_model=chat_response,
    summary="Get response from OpenAI Chat Completion with prompt string and result count",
    response_description="Answer (string which represents the completion) and sources used",
)
async def chat_handler_langchain(request: Request, query: query):
    _logger.info({"message": "Calling Chat Endpoint {query.}"})
   
    rows = await helperWithLangChain(request, query)
    
    if len(rows) == 0:
        return chat_response(answer='No results found', sources=[])
    
    pages = []
    reply = ""
    try:
        reply = chat_completion(query, rows)
        
        for row in rows:
            dic = dict(row)
            pages.append(dic)
                 
    except:
        _logger.exception({"message": "Error generating chat completion"},)
        raise exceptions.InvalidChatCompletionException

    return chat_response(answer=reply, sources=pages)



async def helperWithLangChain(request: Request, query: query):
    try:
        _logger.info({"message": f"Creating embedding using {query.backend}"})
        db_search_function = ""
        if 'openai' in query.backend:
            embeddings = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"), deployment=os.getenv("OPENAI_EMBEDDING_MODEL_NAME"))
            db_search_function = os.getenv("POSTGRES_SEARCH_FUNCTION") 
        elif 'bedrock' in query.backend or 'sagemaker' in query.backend:
            ensure_bedrock_client('us-east-1')
            embeddings = BedrockEmbeddings(region_name= 'us-east-1', model_id="amazon.titan-e1t-medium", 
                                           client=bedrock_client)
            db_search_function = os.getenv("POSTGRES_SEARCH_FUNCTION_TITAN") 
        
        embedding = embeddings.embed_query(query.prompt) 
        print(len(embedding))      
        print(f'Embedding: {embedding}')
        print(f'db_search_function: {db_search_function}')
        sql = "SELECT * FROM " + db_search_function+ " ($1, $2, $3)"
    except:
        _logger.exception({"message": "Issue with creating an embedding."})
        raise exceptions.InvalidPromptEmbeddingException
    
    try:
        _logger.info({"message": "Querying Postgres"})
        res = await request.app.state.db.fetch_rows(
            sql, np.array(embedding), query.similarity_threshold, query.results
        )
    except:
        _logger.exception({"message": "Issue with querying Postgres."})
        raise exceptions.InvalidPostgresQueryException

    return res