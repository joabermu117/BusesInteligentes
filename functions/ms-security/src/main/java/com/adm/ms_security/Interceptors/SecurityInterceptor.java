package com.adm.ms_security.Interceptors;

import com.adm.ms_security.Models.User;
import com.adm.ms_security.Services.ValidatorService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

@Component
public class SecurityInterceptor implements HandlerInterceptor {
    @Autowired
    private ValidatorService validatorService;

    @Override
    public boolean preHandle(HttpServletRequest request,
            HttpServletResponse response,
            Object handler)
            throws Exception {
        // Let browser preflight checks pass without auth validation.
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        User authenticatedUser = this.validatorService.getUser(request);
        if (authenticatedUser == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
            return false;
        }

        boolean success = this.validatorService.validationRolePermission(
                request,
                request.getRequestURI(),
                request.getMethod());

        if (!success) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN); // 403
            return false; // Detener la ejecución del controlador
        }

        return true; // Continuar con la ejecución del controlador

    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler,
            ModelAndView modelAndView) throws Exception {
        // Lógica a ejecutar después de que se haya manejado la solicitud por el
        // controlador
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler,
            Exception ex) throws Exception {
        // No after-completion processing needed
    }
}
