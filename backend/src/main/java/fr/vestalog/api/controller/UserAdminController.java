package fr.vestalog.api.controller;

import fr.vestalog.api.dto.admin.RoleUpdateRequest;
import fr.vestalog.api.dto.auth.UserDto;
import fr.vestalog.api.service.UserAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserAdminController {

    private final UserAdminService userAdminService;

    @GetMapping
    public ResponseEntity<List<UserDto>> listUsers() {
        return ResponseEntity.ok(userAdminService.listAll());
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<UserDto> updateRole(
            @PathVariable UUID id,
            @Valid @RequestBody RoleUpdateRequest request,
            @AuthenticationPrincipal String callerEmail) {
        return ResponseEntity.ok(userAdminService.updateRole(id, request.role(), callerEmail));
    }
}
