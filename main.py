from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

class ProfilePicture(BaseModel):
    avatar: str
    small_avatar: str
    medium_avatar: str

class UserProfile(BaseModel):
    oneCGuid: str
    lastName: str
    firstName: str
    middleName: str
    lastName_eng: str
    firstName_eng: str
    portalId: str
    email: str
    mobilePhone: str
    extensionPhone: str
    workPhone: str
    workMobilePhone: str
    position: str
    floor: str
    place: str
    tower: str
    birthDate: str
    startDate: str
    supervisor: Optional[str] = None
    personal_assistant: str
    show_phone_number_on_portal: bool
    show_birth_date_on_portal: bool
    show_email_on_portal: bool
    show_on_portal: bool
    profilePicture: ProfilePicture
    department1: str
    department2: str
    department3: str
    department4: str
    department5: str
    department6: str
    department7: str

# Пример данных для пользователей
users = [
    UserProfile(
        oneCGuid="123456",
        lastName="Иванов",
        firstName="Иван",
        middleName="Иванович",
        lastName_eng="Ivanov",
        firstName_eng="Ivan",
        portalId="portal_1",
        email="ivan.ivanov@example.com",
        mobilePhone="+79001234567",
        extensionPhone="1234",
        workPhone="+74951234567",
        workMobilePhone="+79007654321",
        position="Менеджер",
        floor="4",
        place="42",
        tower="северная",
        birthDate="1990-01-01",
        startDate="2020-01-01",
        supervisor=None,
        personal_assistant="Петрова Анна",
        show_phone_number_on_portal=True,
        show_birth_date_on_portal=True,
        show_email_on_portal=True,
        show_on_portal=True,
        profilePicture=ProfilePicture(
            avatar="http://example.com/avatar1.jpg",
            small_avatar="http://example.com/small_avatar1.jpg",
            medium_avatar="http://example.com/medium_avatar1.jpg"
        ),
        department1="Отдел продаж",
        department2="Отдел маркетинга",
        department3="",
        department4="",
        department5="",
        department6="",
        department7=""
    ),
    UserProfile(
        oneCGuid="654321",
        lastName="Петров",
        firstName="Петр",
        middleName="Петрович",
        lastName_eng="Petrov",
        firstName_eng="Petr",
        portalId="portal_2",
        email="petr.petrov@example.com",
        mobilePhone="+79007654321",
        extensionPhone="5678",
        workPhone="+74959876543",
        workMobilePhone="+79009876543",
        position="Разработчик",
        floor="3",
        place="Офис 501",
        tower="Б",
        birthDate="1992-02-02",
        startDate="2021-02-01",
        supervisor="Иванов Иван",
        personal_assistant="Сидорова Ольга",
        show_phone_number_on_portal=True,
        show_birth_date_on_portal=True,
        show_email_on_portal=True,
        show_on_portal=True,
        profilePicture=ProfilePicture(
            avatar="http://example.com/avatar2.jpg",
            small_avatar="http://example.com/small_avatar2.jpg",
            medium_avatar="http://example.com/medium_avatar2.jpg"
        ),
        department1="Отдел разработки",
        department2="Отдел тестирования",
        department3="",
        department4="",
        department5="",
        department6="",
        department7=""
    ),
    UserProfile(
        oneCGuid="789012",
        lastName="Сидоров",
        firstName="Сидор",
        middleName="Сидорович",
        lastName_eng="Sidorov",
        firstName_eng="Sidor",
        portalId="portal_3",
        email="sidor.sidorov@example.com",
        mobilePhone="+79008765432",
        extensionPhone="9101",
        workPhone="+74951234568",
        workMobilePhone="+79007654322",
        position="Дизайнер",
        floor="2",
        place="Офис 201",
        tower="В",
        birthDate="1995-03-03",
        startDate="2022-03-01",
        supervisor="Петров Петр",
        personal_assistant="Кузнецова Анна",
        show_phone_number_on_portal=True,
        show_birth_date_on_portal=True,
        show_email_on_portal=True,
        show_on_portal=True,
        profilePicture=ProfilePicture(
            avatar="http://example.com/avatar3.jpg",
            small_avatar="http://example.com/small_avatar3.jpg",
            medium_avatar="http://example.com/medium_avatar3.jpg"
        ),
        department1="Отдел дизайна",
        department2="Отдел маркетинга",
        department3="",
        department4="",
        department5="",
        department6="",
        department7=""
    )
]

@app.get("/users", response_model=List[UserProfile])
async def get_users():
    return users

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
