from pydantic import BaseModel
from typing import List
from datetime import datetime

class RoleResponse(BaseModel):
    id: int
    title: str
    description: str
    tags: List[str]
    is_active: bool

class RoleSelectionCreate(BaseModel):
    role_ids: List[int]  

class UserRoleSelectionResponse(BaseModel):
    id: int
    role_id: int
    role_title: str
    role_description: str
    role_tags: List[str]
    created_at: datetime
