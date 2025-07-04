from datasets import Dataset

from langchain_pinecone import PineconeVectorStore
from langchain_upstage import UpstageEmbeddings, ChatUpstage
from langchain.docstore.document import Document

from ragas.metrics import context_precision, context_recall
from ragas import evaluate
from pinecone import Pinecone
import os
from dotenv import load_dotenv

load_dotenv()
upstage_api_key = os.getenv("UPSTAGE_API_KEY")
pinecone_api_key = os.environ.get("PINECONE_API_KEY")


# 질문 및 정답 정의
questions = [
    "임산부가 복용하면 안 되는 약은 무엇인가요?",
    "아세트아미노펜과 함께 복용하면 안 되는 약이 있나요?",
    "고혈압 환자가 피해야 할 약물에는 어떤 것이 있나요?",
    "어린이가 복용하면 위험한 약은 무엇인가요?",
    "같이 복용하면 안 되는 약 조합이 있나요?"
]

reference_answers = {
    "임산부가 복용하면 안 되는 약은 무엇인가요?": 
        "토티펜푸마르산염), 안국약품(주)의 코디큐반정80/12.5mg(valsartan+hydrochlorothiazide), 부광약품(주)의 부광메티마졸정(methimazole)이 있습니다. 코푸펜시럽은 임부에 대한 안전성이 미확립되어 있으며, 코디큐반정80/12.5mg은 임신 2~3기에 투여 시 태아 및 신생아의 저혈압, 고칼륨혈증, 신생아 두개골 발육부전, 무뇨증, 신부전, 양수과소증(태아사지구축, 두개안면기형, 폐발육부전과 관련 있음) 및 사망과 관련될 수 있습니다. 부광메티마졸정은 임부에 대한 안전성이 미확립되었으며, 태아에 갑상선종, 갑상선기능억제를 일으킬 수 있고, 임신 초기(14주) 및 고용량 투여 시 선천성 피부 무형성, 두개안면 기형(후비공 폐쇄; 안면기형), 배꼽탈장, 식도폐쇄증, 배꼽창자간막관 기형, 심실사이막결손이 보고되었습니다. 임신 가능성이 있는 여성은 치료기간 동안 효과적으로 피임해야 합니다.",

    "아세트아미노펜과 함께 복용하면 안 되는 약이 있나요?":
        "제공된 정보에는 아세트아미노펜과 함께 복용하면 안 되는 약에 대한 내용은 없습니다. 제공된 정보는 아세클로페낙 성분과 케토롤락트로메타민 성분 사이의 병용금기에 대한 정보만 포함되어 있습니다. 아세트아미노펜과 다른 약물 간의 상호작용에 대한 정확한 정보는 별도의 신뢰할 수 있는 출처나 의료 전문가의 조언을 참조하는 것이 좋습니다.",

    "고혈압 환자가 피해야 할 약물에는 어떤 것이 있나요?":
        "고혈압 환자가 피해야 할 약물로는 임신 중 복용 금지 약물로 언급된 코바로살탄정160/12.5밀리그램, 네오반플러스정, 코디오칸정과 같은 Valsartan과 hydrochlorothiazide를 포함한 some medications이 있습니다. 상세한 정보에 따르면, valsartan은 임신 2~3기에 ACE저해제 투여 시 태아 및 신생아의 저혈압, 고칼륨혈증, 신생아 두개골 발육부전, 무뇨증, 신부전, 양수과소증(태아사지구축, 두개안면기형, 폐발육부전과 관련 있음) 및 사망과 관련이 있습니다. 따라서 고혈압 환자는 이러한 약물을 피하고, 특히 임신 중에는 의료 전문가와 상의하여 적절한 치료를 받아야 합니다.",

    "어린이가 복용하면 위험한 약은 무엇인가요?":
        "어린이가 복용하면 위험한 약으로는 소아용프리마란시럽(메퀴타진)과 코담시럽이 있습니다. 소아용프리마란시럽(메퀴타진)은 2세 이하의 영아에게 투여하지 말아야 하며, 다른 페노치아진계 약물을 소아(특히 2세 이하)에 투여한 경우 유아돌연사망증후군(SIDS) 및 유아 수면시 무호흡발작이 나타났다는 보고가 있습니다. 코담시럽은 12세 미만 소아는 호흡억제 감수성이 크며, 12세 미만 소아에서 사망을 포함하는 중증 호흡억제 위험이 크다는 국외 보고가 있습니다.",

    "같이 복용하면 안 되는 약 조합이 있나요?":
        "에보타즈정과 신플랙스세이프정500/20밀리그램, 마이토린정10/20밀리그램, 오메톤에스정20mg(에스오메프라졸마그네슘이수화물)은 에보타즈정과 함께 복용하면 안 됩니다. 신플랙스세이프정500/20밀리그램은 아타자나비르의 혈중농도를 감소시켜 병용금기이며, 마이토린정10/20밀리그램은 횡문근융해를 포함한 근육병증의 위험을 초래할 수 있어 병용금기입니다. 오메톤에스정20mg(에스오메프라졸마그네슘이수화물) 역시 아타자나비르의 혈중농도를 감소시켜 병용금기입니다."
}

# 모델 초기화
llm = ChatUpstage(api_key=upstage_api_key)
embedding_model_doc = UpstageEmbeddings(api_key=upstage_api_key, model="solar-embedding-1-large")
embedding_model_query = UpstageEmbeddings(api_key=upstage_api_key, model="embedding-query")

# Pinecone vectorstore 연결
index_name = "drug-safety-index"
vectorstore = PineconeVectorStore(
    index_name=index_name,
    embedding=embedding_model_doc,
    pinecone_api_key=pinecone_api_key
)
retriever = vectorstore.as_retriever(
    search_type='mmr',
    search_kwargs={"k": 3}
)

# 평가용 데이터 채우기
def fill_data(data, question, retriever):
    results = retriever.invoke(question)
    context = [doc.page_content for doc in results]
    data["question"].append(question)
    data["answer"].append("")  # LLM 응답을 평가할 경우 여기에 삽입
    data["contexts"].append(context)
    data["ground_truth"].append(reference_answers.get(question, ""))

# RAGAS 평가 함수
def ragas_evaluate(dataset):
    return evaluate(
        dataset,
        metrics=[context_precision, context_recall],
        llm=llm,
        embeddings=embedding_model_query,
    )

# 평가 데이터 준비 및 평가
data = {
    "question": [],
    "answer": [],
    "contexts": [],
    "ground_truth": [],
}
for question in questions:
    fill_data(data, question, retriever)

dataset = Dataset.from_dict(data)
score = ragas_evaluate(dataset)

# 평가 결과 출력
df = score.to_pandas()
print(f"=== pinecone_vectorstore ===")
print("Precision 평균:", df["context_precision"].mean())
print("Recall 평균:", df["context_recall"].mean())
print()
