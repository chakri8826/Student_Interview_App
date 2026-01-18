from fastapi import  Depends, HTTPException, APIRouter
from typing import Annotated, List
from sqlalchemy.orm import Session
from app.models.user_model import User
from app.models.role_model import Role
from app.models.user_role_selection_model import UserRoleSelection
from app.schemas import (
    RoleResponse, RoleSelectionCreate, UserRoleSelectionResponse
)
from app.dependencies import SessionDep, get_curr_user

router = APIRouter()

DEFAULT_ROLES = [
    {
        "title": "Software Engineer",
        "description": "Design, develop, and maintain software systems.",
        "tags": ["software", "engineer", "backend", "frontend"],
    },
    {
        "title": "Data Analyst",
        "description": "Analyze data to produce insights and dashboards.",
        "tags": ["data", "analyst", "sql", "excel"],
    },
    {
        "title": "Cybersecurity Specialist",
        "description": "Protect systems and networks from security threats.",
        "tags": ["security", "cyber", "network", "siem"],
    },
    {
        "title": "Product Manager",
        "description": "Lead product strategy and execution.",
        "tags": ["product", "management", "roadmap"],
    },
    {
        "title": "Business Analyst",
        "description": "Gather requirements and improve business processes.",
        "tags": ["business", "analyst", "process"],
    },
    {
        "title": "AI/ML Engineer",
        "description": "Build AI/ML models and deploy them to production.",
        "tags": ["ai", "ml", "python", "mlops"],
    },
]

@router.get("/roles", response_model=List[RoleResponse])
def get_roles(session: SessionDep):
    try:
        roles = session.query(Role).filter(Role.is_active == True).all()
        if not roles:
             
            for item in DEFAULT_ROLES:
                role = Role(title=item["title"], description=item["description"], tags=item["tags"]) 
                session.add(role)
            session.commit()
            roles = session.query(Role).filter(Role.is_active == True).all()
        else:
             
            existing_titles = {r.title for r in roles}
            inserted = False
            for item in DEFAULT_ROLES:
                if item["title"] not in existing_titles:
                    session.add(Role(title=item["title"], description=item["description"], tags=item["tags"]))
                    inserted = True
            if inserted:
                session.commit()
                roles = session.query(Role).filter(Role.is_active == True).all()
        return [
            {
                "id": role.id,
                "title": role.title,
                "description": role.description,
                "tags": role.tags or [],
                "is_active": role.is_active
            }
            for role in roles
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get roles: {str(e)}")

@router.post("/my/roles")
def add_role_selection(
    role_data: RoleSelectionCreate,
    current_user: Annotated[User, Depends(get_curr_user)],
    session: SessionDep
    ):
    try:
        added_roles = []
        skipped_roles = []
        
        for role_id in role_data.role_ids:
             
            role = session.query(Role).filter(Role.id == role_id, Role.is_active == True).first()
            if not role:
                raise HTTPException(status_code=404, detail=f"Role with ID {role_id} not found or inactive")
            
             
            existing_selection = session.query(UserRoleSelection).filter(
                UserRoleSelection.user_id == current_user.id,
                UserRoleSelection.role_id == role_id
            ).first()
            
            if existing_selection:
                skipped_roles.append(role_id)
                continue   
            
             
            role_selection = UserRoleSelection(user_id=current_user.id, role_id=role_id)
            session.add(role_selection)
            added_roles.append(role_id)
        
        session.commit()
        
        response_message = f"Successfully added {len(added_roles)} role(s)"
        if skipped_roles:
            response_message += f", skipped {len(skipped_roles)} already selected role(s)"
        
        return {
            "message": response_message,
            "added_role_ids": added_roles,
            "skipped_role_ids": skipped_roles
        }
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add role selections: {str(e)}")

@router.post("/my/roles/set")
def set_user_roles(
    role_data: RoleSelectionCreate,
    current_user: Annotated[User, Depends(get_curr_user)],
    session: SessionDep
):
                     
    try:
         
        valid_ids = [r.id for r in session.query(Role).filter(Role.id.in_(role_data.role_ids), Role.is_active == True).all()]
        if len(valid_ids) != len(role_data.role_ids):
            raise HTTPException(status_code=400, detail="One or more roles are invalid or inactive")

        session.query(UserRoleSelection).filter(UserRoleSelection.user_id == current_user.id).delete()
         
        for rid in role_data.role_ids:
            session.add(UserRoleSelection(user_id=current_user.id, role_id=rid))
        session.commit()
        return {"message": "Role selection updated", "role_ids": role_data.role_ids}
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to set user roles: {str(e)}")

@router.get("/my/roles", response_model=List[UserRoleSelectionResponse])
def get_user_roles(current_user: Annotated[User, Depends(get_curr_user)], session: SessionDep):
    try:
        role_selections = session.query(UserRoleSelection, Role).join(
            Role, UserRoleSelection.role_id == Role.id
        ).filter(
            UserRoleSelection.user_id == current_user.id,
            Role.is_active == True
        ).all()
        return [
            {
                "id": selection.id,
                "role_id": role.id,
                "role_title": role.title,
                "role_description": role.description,
                "role_tags": role.tags or [],
                "created_at": selection.created_at
            }
            for selection, role in role_selections
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user roles: {str(e)}")


