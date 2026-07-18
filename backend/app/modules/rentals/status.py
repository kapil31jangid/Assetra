RENTAL_ORDER_STATUS_TRANSITIONS: dict[str, set[str]] = {
    "draft": {"quotation", "cancelled"},
    "quotation": {"quotation_sent", "confirmed", "cancelled"},
    "quotation_sent": {"confirmed", "cancelled"},
    "confirmed": {"invoiced", "reserved", "cancelled"},
    "invoiced": {"reserved", "cancelled"},
    "reserved": {"picked_up", "late_pickup", "cancelled"},
    "picked_up": {"late_return", "returned"},
    "late_pickup": {"picked_up", "cancelled"},
    "late_return": {"returned"},
    "returned": set(),
    "cancelled": set(),
}
