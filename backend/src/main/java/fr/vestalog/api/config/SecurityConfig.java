package fr.vestalog.api.config;

import fr.vestalog.api.filter.JwtAuthFilter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
        throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s ->
                s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth ->
                auth
                    .requestMatchers("/api/auth/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/missions")
                    .authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/missions/*")
                    .authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/missions")
                    .authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/missions/*/participants")
                    .authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/api/missions/*/participants/*")
                    .authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/missions/**")
                    .hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/missions/**")
                    .hasRole("ADMIN")
                    .requestMatchers(HttpMethod.GET, "/api/consumables")
                    .hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/api/consumables")
                    .hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/api/consumables/**")
                    .hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/consumables/**")
                    .hasRole("ADMIN")
                    .requestMatchers(HttpMethod.GET, "/api/lots")
                    .hasRole("ADMIN")
                    .requestMatchers(HttpMethod.GET, "/api/lots/**")
                    .hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/api/lots")
                    .hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/api/lots/**")
                    .hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/api/lots/**")
                    .hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/lots/**")
                    .hasRole("ADMIN")
                    .requestMatchers("/api/sacs/**")
                    .hasRole("ADMIN")
                    .requestMatchers("/api/pochettes/**")
                    .hasRole("ADMIN")
                    .requestMatchers("/api/items/**")
                    .hasRole("ADMIN")
                    .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")
                    .requestMatchers("/error").permitAll()
                    .anyRequest()
                    .authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            )
            .addFilterBefore(
                jwtAuthFilter,
                UsernamePasswordAuthenticationFilter.class
            )
            .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(
            List.of("http://localhost:5173", "http://localhost:3000")
        );
        config.setAllowedMethods(
            List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        );
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
