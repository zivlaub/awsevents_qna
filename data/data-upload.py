import psycopg2

import json

import tiktoken
import re
import openai
import numpy as np
import os
from dotenv import load_dotenv
from pgvector.psycopg2 import register_vector
import boto3
import json
import botocore

bucket_name='awseventsgpt'
print (f"boto3={boto3.__version__}, botocore={botocore.__version__}")
#bucket_name='youtube-qna'

load_dotenv()

def num_tokens_from_string(string: str, encoding_name: str) -> int:
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.get_encoding(encoding_name)
    num_tokens = len(encoding.encode(string))
    return num_tokens

class PGChunk:
    def __init__(self, title, url, content, content_length, content_tokens, embedding):
        self.page_title = title
        self.page_url = url
        self.content = content
        self.content_length = content_length
        self.content_tokens = content_tokens
        self.embedding = embedding

class PGPage:
    def __init__(self, title, url, content, length, tokens, chunks):
        self.title = title
        self.url = url
        self.content = content
        self.length = length
        self.tokens = tokens
        self.chunks = chunks

def chunk_page(content):
    CHUNK_SIZE = 200
    CHUNK_MAX = 250
    page_text_chunks = [];
    if num_tokens_from_string(content, "cl100k_base") > CHUNK_SIZE:
        split = '@@@'.join(content.split('. ')).split('@@@')
        chunkText = ""
        for sentence in split:
            sentence = sentence.strip()
            if len(sentence) == 0: 
                continue
            sentence_tokens = num_tokens_from_string(sentence, "cl100k_base");
            if sentence_tokens > CHUNK_SIZE:
                continue
            chunk_tokens = num_tokens_from_string(chunkText, "cl100k_base");
            if chunk_tokens + sentence_tokens > CHUNK_SIZE:
                page_text_chunks.append(chunkText.strip());
                chunkText = "";
            if re.search('[a-zA-Z]', sentence[-1]):
                chunkText += sentence + '. '
            else:
                chunkText += sentence + ' '
        page_text_chunks.append(chunkText.strip());
    else:
        page_text_chunks.append(content.strip())
    
    if len(page_text_chunks) > 2:
        last_elem = num_tokens_from_string(page_text_chunks[-1], "cl100k_base")
        second_to_last_elem = num_tokens_from_string(page_text_chunks[-2], "cl100k_base")
        if last_elem + second_to_last_elem < CHUNK_MAX:
            page_text_chunks[-2] += page_text_chunks[-1]
            page_text_chunks.pop()
    
    return page_text_chunks


def embed_chunk(title, url, content):
    embedding = openai.Embedding.create(
        input = content, 
        model = 'text-embedding-ada-002')['data'][0]['embedding']
    chunk = PGChunk(title, url, content, len(content), num_tokens_from_string(content, "cl100k_base"), embedding)
    return chunk

def make_page(cur, bedrock, s3driver, filekey):
    try:
        filename="data/"+filekey
        response = s3driver.get_object(Bucket=bucket_name, Key=filename)
        content = response['Body'].read().decode('utf-8')
        json_content = json.loads(content)
        title = json_content['title']
        content = json_content['content']
        if content == None:
            print("skipping...")
            return
        summary = json_content['summary']
        url = json_content['link']
        event = json_content['event']
        playlist = json_content['playlist']
        
        page_text_chunks = chunk_page(content)

        for chunk in page_text_chunks:
            # pg_chunk = embed_chunk(title, url, chunk)
            # embedding = np.array(pg_chunk.embedding)
            embedding_titan_arr=embed_titan(bedrock, chunk)
            embedding_titan=np.array(embedding_titan_arr)
            sql = 'INSERT INTO ' + os.getenv('POSTGRES_TABLE_NAME') + '(page_title, page_url, content, content_length, content_tokens, embedding, summary) VALUES (%s, %s, %s, %s, %s, %s, %s);'
            #complete the sql
            sql = "UPDATE " + os.getenv('POSTGRES_TABLE_NAME') + " SET embedding_titan = %s WHERE content = %s"

            cur.execute(sql, (embedding_titan, chunk))

            print("--------------")
            # cur.execute(sql, (
            #     pg_chunk.page_title,
            #     pg_chunk.page_url,
            #     pg_chunk.content,
            #     str(pg_chunk.content_length),
            #     str(pg_chunk.content_tokens),
            #     embedding,
            #     summary))
    except (Exception) as error:
        print("error parsing")
        print(error)

def main():
    bedrock = get_bedrock_sdk()
    


    openai.api_key = os.getenv('OPENAI_API_KEY')
    conn = None
    try :
        print('Connecting to the PostgreSQL database...')
        conn = psycopg2.connect(
            host = os.getenv('POSTGRES_HOST'),
            database = os.getenv('POSTGRES_DB_NAME'),
            user = os.getenv('POSTGRES_USERNAME'),
            password = os.getenv('POSTGRES_PASSWORD')
        )
        register_vector(conn)

        cur = conn.cursor()

        s3 = boto3.client('s3')
        additional = open("additional.txt", "r")
        counter=0
        for filekey in additional.readlines():
            make_page(cur, bedrock,s3, filekey.rstrip())
            print(counter)
            counter =counter+1

        additional.close()
        conn.commit()
        cur.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print("global error")
        print(error)
    finally:
        if conn is not None:
            conn.close()
            print('Database connection closed.')

def embed_titan(bedrock,chunk):
    body = json.dumps({"inputText": chunk})
    modelId = 'amazon.titan-tg1-large' # change this to use a different version from the model provider
    accept = 'application/json'
    contentType = 'application/json'
    response = bedrock.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)
    response_body = json.loads(response.get('body').read())
    return response_body.get('embedding')

def get_bedrock_sdk():
    role_arn = 'arn:aws:iam::114798159153:role/service-role/AmazonSageMaker-ExecutionRole-20230604T083841' # <---- put the role from the Bedrock account here
    session_name = 'demo'
    region = 'us-east-1'
    external_id = 'eitans'   ### cross account role external id
    sts_client = boto3.client('sts', region_name=region)
    response = sts_client.assume_role(
        RoleArn=role_arn,
        RoleSessionName=session_name,
        ExternalId=external_id
    )
    credentials=response['Credentials']
    tmpsession=boto3.Session(
        aws_access_key_id=credentials['AccessKeyId'],
        aws_secret_access_key=credentials['SecretAccessKey'],
        aws_session_token=credentials['SessionToken'],
        region_name=region
    )

    bedrock = tmpsession.client(service_name='bedrock',region_name='us-east-1',endpoint_url='https://bedrock.us-east-1.amazonaws.com')
    print(bedrock.list_foundation_models())
    return bedrock

   
if __name__ == "__main__":

    main()
