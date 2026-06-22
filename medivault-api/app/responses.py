"""Standard API response envelope helpers."""
from typing import Any, Optional


def ok(data: Any = None, message: Optional[str] = None) -> dict[str, Any]:
    body: dict[str, Any] = {"success": True, "data": data}
    if message:
        body["message"] = message
    return body


def paginated(items: list, page: int, per_page: int, total_items: int) -> dict[str, Any]:
    total_pages = max(1, (total_items + per_page - 1) // per_page)
    return {
        "success": True,
        "data": items,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total_items": total_items,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
    }
