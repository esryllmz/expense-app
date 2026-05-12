package com.qoex.expense_app.core.events;

import com.qoex.expense_app.model.LeaveRequest;

public record LeaveCreatedEvent(LeaveRequest leaveRequest) {
}