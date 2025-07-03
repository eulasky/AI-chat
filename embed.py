import os
import pandas as pd

from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_pinecone import PineconeVectorStore
# from langchain_upstage import UpstageDocumentParseLoader
from langchain_upstage import UpstageEmbeddings
from pinecone import Pinecone, ServerlessSpec

load_dotenv()

# upstage models
upstage_api_key = os.environ.get("UPSTAGE_API_KEY")
embedding_upstage = UpstageEmbeddings(
    model="embedding-query",
    api_key=upstage_api_key)

pinecone_api_key = os.environ.get("PINECONE_API_KEY")
pc = Pinecone(api_key=pinecone_api_key)
index_name = "drug-safety-index"
# pdf_path = "Galaxy_A_35.pdf"

# create new index
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=4096,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )

print("start")

df = pd.read_csv("comprehensive_drug_safety_docs.csv")

text_column = 'text'
if text_column not in df.columns:
    raise ValueError(f"'{text_column}' 컬럼이 CSV에 존재하지 않습니다. 컬럼명 확인 요청드립니다.")

# Convert each row to Document object
docs = [Document(page_content=row[text_column]) for _, row in df.iterrows()]



# document_parse_loader = UpstageDocumentParseLoader(
#     pdf_path,
#     output_format='html',  # 결과물 형태 : HTML
#     coordinates=False)  # 이미지 OCR 좌표계 가지고 오지 않기

# docs = document_parse_loader.load()

# Split the document into chunks

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=100)

# Embed the splits

splits = text_splitter.split_documents(docs)

PineconeVectorStore.from_documents(
    splits, embedding_upstage, index_name=index_name
)
print("end")
