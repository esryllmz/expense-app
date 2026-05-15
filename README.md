# CapitalFlow

CapitalFlow, çalışanların harcama ve izin talepleri oluşturabildiği; takım liderleri ve genel müdürün ise yetkileri dahilinde bu talepleri görüntüleyip onaylayabildiği tam yığın bir yönetim uygulamasıdır.

Proje üç ana parçadan oluşur:

```txt
server/   -> Java Spring Boot REST API
client/   -> React + TypeScript web uygulaması
mobile/   -> Expo React Native mobil uygulama
```

## Temel İş Akışı

- Çalışanlar kendi harcama ve izin taleplerini oluşturur.
- Takım liderleri kendi taleplerini ve bağlı çalışanlarının taleplerini görüntüler.
- Takım liderleri sadece bağlı çalışanlarının bekleyen taleplerini onaylayabilir veya reddedebilir.
- Genel müdür tüm organizasyon taleplerini görüntüler ve yönetir.
- Genel müdür kendi adına harcama veya izin talebi oluşturmaz.
- Talep oluşturulduğunda ilgili yönetici tarafında bildirim mantığı çalışır.
- Web ve mobil uygulamalar backend response modeline göre ortak davranır.

## Roller

```txt
ROLE_GM           -> Genel Müdür
ROLE_TEAM_LEADER  -> Takım Lideri
ROLE_EMPLOYEE     -> Çalışan
```

## Backend

Backend Java Spring Boot ile geliştirilmiştir. Katmanlı mimari tercih edilmiştir.

```txt
Controller
  -> Service Interface
    -> Service Implementation
      -> Business Rules
        -> Repository
          -> Entity
```

### Kullanılan Temel Yapılar

- Spring Boot
- Spring Security
- JWT Authentication
- Refresh Token
- Spring Data JPA
- Jakarta Validation
- Lombok
- Async Event Listener
- Global Exception Handler
- DTO tabanlı response/request modeli

### Auth Akışı

Login başarılı olduğunda backend şu bilgileri döner:

```ts
{
  accessToken: string;
  refreshToken: string;
  user: User;
}
```

Access token protected endpointlerde `Authorization: Bearer <token>` header’ı ile gönderilir.

Refresh token ile oturum yenilenebilir. Backend restart olduğunda mevcut runtime token version değiştiği için eski access tokenlar geçersiz olur. Startup sırasında refresh token kayıtları da temizlenir.

### Ortak API Response Formatı

```ts
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  statusCode: number;
  errors?: string[] | Record<string, string>;
}
```

### Backend Endpointleri

#### Auth

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh-token
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

#### Expenses

```http
POST  /api/v1/expenses
GET   /api/v1/expenses/me
GET   /api/v1/expenses/subordinates
PATCH /api/v1/expenses/{id}/status
```

#### Leaves

```http
POST  /api/v1/leaves
GET   /api/v1/leaves/me
GET   /api/v1/leaves/subordinates
PATCH /api/v1/leaves/{id}/status
```

#### Users

```http
GET    /api/v1/users
GET    /api/v1/users/{id}
PUT    /api/v1/users/profile
PATCH  /api/v1/users/change-password
DELETE /api/v1/users/{id}
PATCH  /api/v1/users/{id}/manager
```

## Domain Modelleri

### User

```ts
type UserRole = 'ROLE_GM' | 'ROLE_TEAM_LEADER' | 'ROLE_EMPLOYEE';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  managerId?: number | null;
  managerName?: string | null;
}
```

### Expense

```ts
type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface Expense {
  id: number;
  description: string;
  amount: number;
  status: RequestStatus;
  employeeFullName: string;
  employeeId: number;
  createdDate: string;
}
```

### Leave

```ts
interface Leave {
  id: number;
  description: string;
  startDate: string;
  endDate: string;
  status: RequestStatus;
  employeeFullName: string;
  employeeId: number;
}
```

## Web Client

Web client React + TypeScript ile geliştirilmiştir. API iletişimi merkezi `apiClient` üzerinden yapılır.

### Temel Yaklaşım

- Token bilgisi local storage üzerinden yönetilir.
- Protected requestlerde access token otomatik eklenir.
- 401 response geldiğinde refresh token akışı çalışır.
- Refresh başarılı olursa istek tekrar denenir.
- Refresh başarısız olursa session temizlenir ve login ekranına yönlendirilir.
- Role bazlı görünürlük client tarafında sadece UX amacıyla uygulanır.
- Güvenlik kontrolleri backend tarafında kalır.

### Web Servisleri

```ts
authService.login
authService.register
authService.logout
authService.me

expenseService.getMine
expenseService.getSubordinates
expenseService.create
expenseService.updateStatus

leaveService.getMine
leaveService.getSubordinates
leaveService.create
leaveService.updateStatus

userService.updateProfile
userService.changePassword
```

### Web Ekranları

```txt
AuthPage       -> Login / Register
DashboardPage  -> Özet bilgiler ve son talepler
ExpensesPage   -> Harcama talepleri
LeavePage      -> İzin talepleri
SettingsPage   -> Profil ve şifre işlemleri
```

### Bildirim Mantığı

Web tarafında topbar bildirimleri mevcut harcama ve izin endpointleri üzerinden bekleyen talepleri okuyarak oluşturur.

- GM ve Team Lead için bağlı personel talepleri gösterilir.
- Employee için kendi bekleyen talepleri gösterilir.
- Bildirime tıklanınca ilgili talebin detay modalı açılır.
- Onayla/Reddet işlemi modal üzerinden yapılır.
- İşlem sonrası bildirim listesi tekrar yüklenir.

## Mobile

Mobil uygulama Expo React Native + TypeScript ile geliştirilmiştir.

### Temel Yaklaşım

- Navigation yapısı stack + bottom tab üzerinden kuruludur.
- Auth bilgileri `expo-secure-store` içinde saklanır.
- API iletişimi Axios tabanlı merkezi `apiClient` üzerinden yapılır.
- 401 durumunda refresh token akışı çalışır.
- Refresh başarısız olursa local tokenlar temizlenir.
- Web client ile aynı endpoint ve role kuralları kullanılır.

### Mobile Navigation

```txt
Auth
MainTabs
  - Dashboard
  - Expenses
  - Leaves
  - Profile
```

### Mobile Servisleri

```ts
authService.login
authService.register
authService.logout
authService.me

expenseService.getMine
expenseService.getSubordinates
expenseService.create
expenseService.updateStatus

leaveService.getMine
leaveService.getSubordinates
leaveService.create
leaveService.updateStatus

userService.updateProfile
userService.changePassword
```

### Mobile Bildirim Mantığı

Mobilde ortak `AppHeader` içinde bildirim ikonu bulunur.

- Bildirimler mevcut expense ve leave endpointlerinden alınır.
- Bekleyen talepler listelenir.
- Bildirime tıklanınca route değiştirilmez.
- Doğrudan ortak `ApprovalModal` açılır.
- Onayla/Reddet işlemi modal üzerinden yapılır.
- İşlem sonrası bildirimler yeniden yüklenir.

## Yetki Kuralları

Client ve mobile tarafındaki role kontrolleri sadece kullanıcı deneyimini düzenlemek içindir. Nihai güvenlik backend tarafından sağlanır.

Onay/red işlemi için temel kural:

```ts
canManageRequests(role) &&
status === 'PENDING' &&
currentUserId !== employeeId
```

Yani:

- Kullanıcı GM veya Team Lead olmalıdır.
- Talep beklemede olmalıdır.
- Kullanıcı kendi talebini onaylayamaz.
- Sonuçlanmış talepler tekrar güncellenemez.

## Validasyonlar

### Harcama

- Açıklama boş olamaz.
- Tutar 0’dan büyük olmalıdır.
- Talep oluşturan kullanıcının yöneticisi bulunmalıdır.

### İzin

- Açıklama boş olamaz.
- Başlangıç tarihi zorunludur.
- Bitiş tarihi zorunludur.
- Geçmiş tarih seçilemez.
- Bitiş tarihi başlangıç tarihinden önce olamaz.
- Talep oluşturan kullanıcının yöneticisi bulunmalıdır.

### Şifre

- En az 8 karakter olmalıdır.
- En az bir büyük harf içermelidir.
- En az bir küçük harf içermelidir.
- En az bir rakam içermelidir.
- Yeni şifre ve tekrar şifre eşleşmelidir.

## Local Çalıştırma

### Backend

```bash
cd server
./mvnw spring-boot:run
```

Backend varsayılan adres:

```txt
http://localhost:8080/api/v1
```

### Web Client

```bash
cd client
npm install
npm run dev
```

Web client varsayılan adres:

```txt
http://localhost:5173
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

Android emulator için backend base URL:

```txt
http://10.0.2.2:8080/api/v1
```

Gerçek cihazda test için bilgisayarın local IP adresi kullanılmalıdır:

```txt
http://192.168.x.x:8080/api/v1
```

## Demo Kullanıcılar

Seed data ile örnek kullanıcılar oluşturulur.

```txt
Genel Müdür:
gm@qoex.com

Takım Liderleri:
tla@qoex.com
tlb@qoex.com

Çalışanlar:
ali@qoex.com
ayse@qoex.com
can@qoex.com
```

Varsayılan şifre:

```txt
123456
```

## Notlar

- Backend stateless JWT mimarisiyle çalışır.
- Refresh token kullanıcı üzerinde saklanır.
- Uygulama restart olduğunda refresh token kayıtları temizlenir.
- Bildirim yapısı mevcut endpointler üzerinden bekleyen talepleri okuyarak çalışır.
- Gerçek zamanlı kalıcı bildirim sistemi için ayrıca Notification entity, notification endpointleri veya WebSocket/SSE mimarisi eklenebilir.
