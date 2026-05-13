package com.qoex.expense_app.config;

import com.qoex.expense_app.core.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@EnableWebSecurity // Güvenlik ayarlarını aktif eder
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. CORS'u güvenlik zincirine dahil et
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 2. CSRF'i devre dışı bırak (Stateless API için standart)
                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(auth -> auth
                        // 3. Preflight (Ön denetim) isteklerine koşulsuz izin ver (CORS için kritik)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 4. Auth endpoint'leri herkes için açık
                        .requestMatchers("/api/v1/auth/**").permitAll()

                        // 5. Diğer her şey için JWT doğrulaması şart
                        .anyRequest().authenticated())

                // 6. Oturum yönetimi yok, her istek bağımsız (JWT mantığı)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 7. Kendi yazdığımız JWT filtresini standart filtrenin önüne koy
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // CORS Politikasını burada tanımlıyoruz
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // React'ın çalıştığı portu (Origin) buraya yazıyoruz
        configuration.setAllowedOrigins(Collections.singletonList("http://localhost:5173"));

        // İzin verilen HTTP metodları
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // İzin verilen başlıklar (Authorization ve Content-Type en önemlileri)
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));

        // Tarayıcının kimlik bilgilerini (Token, Cookie vb.) göndermesine izin ver
        configuration.setAllowCredentials(true);

        // Tüm API yolları için bu ayarları geçerli kıl
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}