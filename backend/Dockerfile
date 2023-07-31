#FROM python:3.11.1-slim
FROM tiangolo/uvicorn-gunicorn-fastapi:python3.11
WORKDIR /awsgpt

COPY ./requirements.txt ./requirements.txt

RUN pip install --no-cache-dir --upgrade -r ./requirements.txt

COPY ./app ./app
COPY ./credentials /root/.aws/credentials

COPY ./logging.yaml ./logging.yaml

COPY ./lib ./lib

WORKDIR ./lib

RUN pip install boto3-1.26.142-py3-none-any.whl 
RUN pip install botocore-1.29.142-py3-none-any.whl

WORKDIR /awsgpt
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]
