package com.qoex.expense_app.service.impl;

import com.qoex.expense_app.core.responses.ApiResponse;
import com.qoex.expense_app.core.enums.RequestStatus;
import com.qoex.expense_app.core.enums.UserRole;
import com.qoex.expense_app.core.events.LeaveCreatedEvent;
import com.qoex.expense_app.core.exceptions.NotFoundException;
import com.qoex.expense_app.dto.request.Leave.CreateLeaveRequest;
import com.qoex.expense_app.dto.request.Leave.UpdateLeaveStatusRequest;
import com.qoex.expense_app.dto.response.LeaveResponseDto;
import com.qoex.expense_app.model.Leave;
import com.qoex.expense_app.model.User;
import com.qoex.expense_app.repository.LeaveRepository;
import com.qoex.expense_app.repository.UserRepository;
import com.qoex.expense_app.service.ILeaveService;
import com.qoex.expense_app.service.rules.LeaveBusinessRules;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveServiceImpl implements ILeaveService {

    private final LeaveRepository leaveRequestRepository;
    private final LeaveBusinessRules businessRules;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public ApiResponse<Void> create(CreateLeaveRequest request, Long employeeId) {
        // 1. İş Kuralı: Tarihlerin mantıksal kontrolü (S: Single Responsibility)
        businessRules.validateDates(request.startDate(), request.endDate());

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Kullanıcı bulunamadı."));

        Leave leave = new Leave();
        leave.setDescription(request.description());
        leave.setStartDate(request.startDate());
        leave.setEndDate(request.endDate());
        leave.setStatus(RequestStatus.PENDING);
        leave.setEmployee(employee);

        Leave savedLeave = leaveRequestRepository.save(leave);

        User manager = employee.getManager();

        eventPublisher.publishEvent(new LeaveCreatedEvent(
                savedLeave.getId(),
                employee.getId(),
                employee.getFirstName() + " " + employee.getLastName(),
                manager != null ? manager.getId() : null,
                manager != null ? manager.getFirstName() + " " + manager.getLastName() : null,
                savedLeave.getStartDate(),
                savedLeave.getEndDate()));

        log.info("İzin talebi oluşturuldu ve bildirim kuyruğuna eklendi. ID: {}", savedLeave.getId());

        return ApiResponse.success(null, "İzin talebi başarıyla oluşturuldu.", 201);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<LeaveResponseDto>> getMyLeaves(Long employeeId) {
        // Eksik metodun implementasyonu
        List<LeaveResponseDto> list = leaveRequestRepository.findAllByEmployeeId(employeeId)
                .stream()
                .map(LeaveResponseDto::fromEntity)
                .toList();
        return ApiResponse.success(list, "İzin talepleriniz listelendi.", 200);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<LeaveResponseDto>> getSubordinateLeaves(Long managerId) {
        User currentUser = userRepository.findById(managerId)
                .orElseThrow(() -> new NotFoundException("Kullanıcı bulunamadı."));

        List<Leave> leaves;

        if (currentUser.getRole() == UserRole.ROLE_GM) {
            // GM tüm şirket izin taleplerini görür.
            leaves = leaveRequestRepository.findAllCompanyLeavesExceptCurrentUser(managerId);
        } else {
            // Team Lead sadece direkt bağlı çalışanlarının izin taleplerini görür.
            leaves = leaveRequestRepository.findSubordinateLeaves(managerId);
        }

        List<LeaveResponseDto> response = leaves
                .stream()
                .map(LeaveResponseDto::fromEntity)
                .toList();

        return ApiResponse.success(response, "Bağlı personel izin talepleri getirildi.", 200);
    }

    @Override
    @Transactional
    public ApiResponse<Void> updateStatus(Long leaveId, UpdateLeaveStatusRequest request, Long managerId) {
        Leave leave = businessRules.getIfExist(leaveId);

        businessRules.statusMustBeFinalDecision(request.status());
        businessRules.validateManagerAction(leave, managerId);
        businessRules.leaveMustBePending(leave);

        leave.setStatus(request.status());
        leaveRequestRepository.save(leave);

        return ApiResponse.success(null, "İzin durumu başarıyla güncellendi.", 200);
    }
}