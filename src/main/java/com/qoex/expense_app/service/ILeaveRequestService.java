package com.qoex.expense_app.service;

import com.qoex.expense_app.core.responses.ApiResponse;
import com.qoex.expense_app.dto.request.LeaveRequest.CreateLeaveRequest;
import com.qoex.expense_app.dto.request.LeaveRequest.UpdateLeaveStatusRequest;
import com.qoex.expense_app.dto.response.LeaveRequestResponseDto;

import java.util.List;

public interface ILeaveRequestService {

    // Çalışanın yeni izin talebi oluşturması (.NET: AddAsync)
    ApiResponse<Void> create(CreateLeaveRequest request, Long employeeId);

    // Çalışanın kendi izinlerini görmesi (.NET: GetAllAsync with Filter)
    ApiResponse<List<LeaveRequestResponseDto>> getMyLeaves(Long employeeId);

    // Yöneticinin bağlı çalışanlarının izinlerini görmesi
    ApiResponse<List<LeaveRequestResponseDto>> getSubordinateLeaves(Long managerId);

    // Yöneticinin izin onaylaması veya reddetmesi (.NET: UpdateAsync)
    ApiResponse<Void> updateStatus(Long leaveId, UpdateLeaveStatusRequest request, Long managerId);
}
