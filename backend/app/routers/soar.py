from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
import time

from ..schemas import SOARActionRequest, SOARActionResponse

router = APIRouter(prefix="/api/soar", tags=["soar"])

@router.post("/execute", response_model=SOARActionResponse)
async def execute_soar_action(action: SOARActionRequest):
    """Execute SOAR automation action"""
    
    valid_actions = ["block_ip", "disable_account", "send_notification"]
    if action.action_type not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action type. Must be one of: {', '.join(valid_actions)}"
        )
    
    # Simulate action execution
    time.sleep(0.05)  # Simulate network delay
    
    messages = {
        "block_ip": f"IP address {action.target} has been blocked in firewall",
        "disable_account": f"Account {action.target} has been disabled",
        "send_notification": f"Security notification sent to {action.target}"
    }
    
    return SOARActionResponse(
        success=True,
        message=messages[action.action_type],
        action_type=action.action_type,
        target=action.target
    )

