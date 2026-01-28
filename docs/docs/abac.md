---
sidebar_position: 3
---

# ABAC Security Layer

OntoLearn Annotator implements a fine-grained **Attribute-Based Access Control (ABAC)** system that provides advanced permission management for all project resources and actions. This security layer enables precise control over who can access what resources under which circumstances.

## Overview

ABAC is a security model that grants access rights based on attributes rather than traditional roles. In OntoLearn Annotator, access decisions are made by evaluating:

- **Subject attributes**: Properties of the user making the request (ID, roles, groups, etc.)
- **Resource attributes**: Properties of the resource being accessed (project ID, type, owner, etc.)
- **Action attributes**: The specific operation being performed (read, write, delete, annotate, etc.)
- **Context attributes**: Environmental factors (time, location, IP address, etc.)

## Architecture

The ABAC system consists of two main services:

1. **ABAC Server**: Validates that requests contain all required attributes (subject, resources, action, and optionally environment)
2. **OPA (Open Policy Agent) Server**: Evaluates policies written in Rego against the validated requests

### Request Flow

1. Application sends access request to ABAC server
2. ABAC server validates request structure and required fields
3. ABAC server forwards validated request to OPA server
4. OPA evaluates policies against request attributes
5. Decision (allow/deny) is returned to the application

### Dynamic Attributes (Available but not used)

The ABAC server implementation provides optional endpoints for querying dynamic variables such as:
- Server load metrics
- Usage limits and quotas  
- Real-time system status
- External service availability

**Note**: This feature is available in the ABAC server but is not currently used in the OntoLearn project. If needed, these dynamic attributes can be accessed via specific endpoints and integrated into policy decisions.

## Configuration

### Environment Variables

Configure the ABAC system in your `.env.local` file:

```bash
# ABAC Service Configuration
ABAC_SERVER_URL=http://localhost:5004
ABAC_SECRET="your-abac-secret-key"
ABAC_CACHE_TTL=3600
ABAC_CACHE_SIZE_LIMIT=10000
```

- `ABAC_SERVER_URL`: URL of your ABAC server
- `ABAC_SECRET`: Shared secret for server authentication
- `ABAC_CACHE_TTL`: Cache time-to-live in seconds
- `ABAC_CACHE_SIZE_LIMIT`: Maximum number of cached decisions

### Security Considerations

**⚠️ Important**: In production deployments:

- **Do not expose the ABAC server publicly** - it should not be accessible from the internet
- **Use local network communication** - Keep OntoLearn and ABAC server communication on the same private network/VPC
- **If internet communication is required** - Use encrypted connections (HTTPS/TLS) and secure network channels (VPN, private tunnels)
- **Network isolation** - Place both services behind firewalls with restricted access rules

The ABAC server handles sensitive authorization decisions and should be treated as a critical internal service.

## Resources

OntoLearn Annotator defines the following resource types based on the current policy implementation:

### Core Resources
- **project**: Main project resources (read: all users, write/delete: admin only)
- **settings**: System and project settings (read: all users, write: admin only)  
- **data**: Datasets and annotation data (read/write: all users, delete: admin only)
- **task**: Annotation tasks (read: all users, write: admin only)
- **playground**: Testing environment (read/write: all users)

### Management Resources  
- **sourceType**: Data source type definitions (list: all users, write/delete: admin only)
- **statistics**: System analytics and reports (read: all users, write: admin only)
- **user**: User management operations (list/invite/edit/delete: admin only)

### Future Resources
Additional resource types can be easily added to the OPA policies as the system evolves.

## Actions

The system currently recognizes the following action types in the OPA policies:

### Basic Operations
- `read`: View or retrieve resources
- `write`: Create, modify, or upload resources  
- `delete`: Remove resources
- `list`: List resources of a specific type

### User Management
- `invite`: Invite new users to the system
- `edit`: Modify user accounts and profiles

Additional actions can be added to the OPA policies as needed for new features.

## Subject Attributes

The current system uses the following subject attributes:

### User Roles
- **ADMIN**: Full administrative access to all resources and actions
- **USER**: Standard user with limited permissions for most operations

### Extensible Attributes
Since requests are sent as JSON objects, any additional subject attributes can be included in the request. The system just needs the corresponding OPA policies updated to handle the new attributes. For example:
- `department`: User's organizational department
- `user_id`: Unique user identifier
- `groups`: User group memberships
- Any custom attributes required by your use case

The flexibility comes from OPA's ability to evaluate any attributes present in the input object.

## Environment Attributes

Environment attributes can be optionally included in requests:

### Dynamic Environment Data (Dynamic requests only)
The ABAC server can call specific functions on its side to retrieve real-time environment data such as:
- Server capacity and load metrics
- Resource availability
- System health indicators
- External service status

**Note**: Dynamic environment attributes are only available when using dynamic request endpoints. Check the ABAC server documentation for the complete list of available functions and how to configure them.

## Policy Examples

The system uses **Open Policy Agent (OPA)** with policies written in **Rego**. Here are the current policy rules:

### Default Policy
```rego
package policy

# Deny by default
default allow := false
```

### Role-Based Helpers
```rego
# HELPERS / ROLE CHECKS
is_admin if {
    input.subject.role == "ADMIN"
}

is_user if {
    input.subject.role == "USER"
}
```

### Project Permissions
```rego
# Project Read: All members (ADMIN + USER)
allow if {
    input.resource.type == "project"
    input.action.name == "read"
    input.subject.role in ["ADMIN", "USER"]
}

# Project Write: Only ADMIN
allow if {
    input.resource.type == "project"
    input.action.name == "write"
    is_admin
}

# Project Delete: Only ADMIN
allow if {
    input.resource.type == "project"
    input.action.name == "delete"
    is_admin
}
```

### Data Permissions
```rego
# Data Read: All members
allow if {
    input.resource.type == "data"
    input.action.name == "read"
    input.subject.role in ["ADMIN", "USER"]
}

# Data Write: All members (both ADMIN + USER can upload data)
allow if {
    input.resource.type == "data"
    input.action.name == "write"
    input.subject.role in ["ADMIN", "USER"]
}

# Data Delete: Only ADMIN
allow if {
    input.resource.type == "data"
    input.action.name == "delete"
    is_admin
}
```

### User Management Permissions
```rego
# User List: Only ADMIN
allow if {
    input.resource.type == "user"
    input.action.name == "list"
    is_admin
}

# User Invite: Only ADMIN
allow if {
    input.resource.type == "user"
    input.action.name == "invite"
    is_admin
}

# User Edit: Only ADMIN (or self for profile)
allow if {
    input.resource.type == "user"
    input.action.name == "edit"
    is_admin
}

# User Delete: Only ADMIN
allow if {
    input.resource.type == "user"
    input.action.name == "delete"
    is_admin
}
```

### Environment-Based Rules
```rego
# Example: Device type constraint
allow if {
    input.subject.role == "employee"
    input.action.name == "read"
    input.subject.department == input.resource.department

    some i
    input.environments.get_device_type[i] == "Device_1"
}
```

### Complete Resource Coverage

The current policies cover:
- **project**: Read (all), Write/Delete (admin only)
- **settings**: Read (all), Write (admin only)  
- **data**: Read/Write (all), Delete (admin only)
- **task**: Read (all), Write (admin only)
- **playground**: Read/Write (all)
- **sourceType**: List (all), Write/Delete (admin only)
- **statistics**: Read (all), Write (admin only)
- **user**: List/Invite/Edit/Delete (admin only)

## Integration Points

ABAC policies are enforced at multiple points in the application:

### API Endpoints
- All tRPC routes are protected by ABAC middleware
- REST API endpoints validate permissions before processing

### UI Components
- Buttons and menus are conditionally rendered based on permissions
- Navigation is filtered by available actions


## Troubleshooting

### Common Issues

**ABAC Server Connection Failed**
- Verify `ABAC_SERVER_URL` is correct and accessible
- Check network connectivity between services
- Ensure ABAC server is running and healthy

**Permission Denied Errors**
- Check that appropriate policies are configured
- Verify user attributes are correctly set
- Review policy evaluation logs on ABAC server
- Empty the ABAC cache of the application

**Performance Issues**
- Adjust `ABAC_CACHE_TTL` and `ABAC_CACHE_SIZE_LIMIT`
- Monitor ABAC server response times
    - Add more policies in the Cache whitelist
- Consider policy optimization

## API Reference

For detailed API documentation and policy management endpoints, see the [ABAC API Documentation](TODO).