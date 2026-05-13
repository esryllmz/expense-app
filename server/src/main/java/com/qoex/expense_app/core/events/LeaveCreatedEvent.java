package com.qoex.expense_app.core.events;

import com.qoex.expense_app.model.Leave;

public record LeaveCreatedEvent(Leave leaveRequest) {
}