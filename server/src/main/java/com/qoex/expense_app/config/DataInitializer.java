package com.qoex.expense_app.config;

import com.qoex.expense_app.core.enums.RequestStatus;
import com.qoex.expense_app.core.enums.UserRole;
import com.qoex.expense_app.core.security.HashingHelper;
import com.qoex.expense_app.model.Expense;
import com.qoex.expense_app.model.LeaveRequest;
import com.qoex.expense_app.model.User;
import com.qoex.expense_app.repository.ExpenseRepository;
import com.qoex.expense_app.repository.LeaveRequestRepository;
import com.qoex.expense_app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            String defaultPass = HashingHelper.createPasswordHash("123456");

            // --- 1. ORGANİZASYON HİYERARŞİSİ ---

            // Genel Müdür
            User gm = saveUser("Ahmet", "Müdür", "gm@qoex.com", defaultPass, UserRole.ROLE_GM, null);

            // Takım Liderleri
            User tlA = saveUser("Mehmet", "LiderA", "tla@qoex.com", defaultPass, UserRole.ROLE_TEAM_LEADER, gm);
            User tlB = saveUser("Zeynep", "LiderB", "tlb@qoex.com", defaultPass, UserRole.ROLE_TEAM_LEADER, gm);

            // Çalışanlar
            User emp1 = saveUser("Ali", "Yılmaz", "ali@qoex.com", defaultPass, UserRole.ROLE_EMPLOYEE, tlA);
            User emp2 = saveUser("Ayşe", "Kaya", "ayse@qoex.com", defaultPass, UserRole.ROLE_EMPLOYEE, tlA);
            User emp3 = saveUser("Can", "Demir", "can@qoex.com", defaultPass, UserRole.ROLE_EMPLOYEE, tlB);

            // --- 2. MASRAF TALEPLERİ (EXPENSES) ---

            // Ali'nin masrafları
            saveExpense("Yol Masrafı (Müşteri Ziyareti)", new BigDecimal("450.00"), RequestStatus.APPROVED, emp1);
            saveExpense("Yemek Bedeli", new BigDecimal("120.50"), RequestStatus.PENDING, emp1);

            // Ayşe'nin masrafları
            saveExpense("Ofis Malzemeleri", new BigDecimal("1500.00"), RequestStatus.PENDING, emp2);
            saveExpense("İnternet Faturası", new BigDecimal("300.00"), RequestStatus.REJECTED, emp2);

            // Can'ın masrafları
            saveExpense("Donanım Alımı (Mouse/Klavye)", new BigDecimal("2250.00"), RequestStatus.PENDING, emp3);

            // --- 3. İZİN TALEPLERİ (LEAVE REQUESTS) ---

            // Ali için izin
            saveLeave(LocalDate.now().plusDays(5), LocalDate.now().plusDays(10), "Yaz Tatili", RequestStatus.PENDING,
                    emp1);

            // Ayşe için izin
            saveLeave(LocalDate.now().minusDays(20), LocalDate.now().minusDays(15), "Sağlık İzni",
                    RequestStatus.APPROVED, emp2);

            System.out.println(">> Seed Data: Tüm organizasyon, masraf ve izin verileri basarili");
        }
    }

    // Helper Metodlar (Kod tekrarını önlemek için - Clean Code)

    private User saveUser(String fName, String lName, String email, String pass, UserRole role, User manager) {
        User user = new User();
        user.setFirstName(fName);
        user.setLastName(lName);
        user.setEmail(email);
        user.setPassword(pass);
        user.setRole(role);
        user.setManager(manager);
        return userRepository.save(user);
    }

    private void saveExpense(String desc, BigDecimal amount, RequestStatus status, User emp) {
        Expense expense = new Expense();
        expense.setDescription(desc);
        expense.setAmount(amount);
        expense.setStatus(status);
        expense.setEmployee(emp);
        expenseRepository.save(expense);
    }

    private void saveLeave(LocalDate start, LocalDate end, String reason, RequestStatus status, User emp) {
        LeaveRequest leave = new LeaveRequest();
        leave.setStartDate(start);
        leave.setEndDate(end);
        leave.setDescription(reason);
        leave.setStatus(status);
        leave.setEmployee(emp);
        leaveRequestRepository.save(leave);
    }
}