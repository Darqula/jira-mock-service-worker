import type { Permission, User } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';

export class PermissionGenerator {
  private static readonly ALL_PERMISSIONS = [
    {
      key: 'BROWSE_PROJECTS',
      name: 'Browse Projects',
      type: 'PROJECT',
      description: 'Ability to browse projects and the issues within them.',
    },
    {
      key: 'CREATE_ISSUES',
      name: 'Create Issues',
      type: 'PROJECT',
      description: 'Ability to create issues.',
    },
    {
      key: 'EDIT_ISSUES',
      name: 'Edit Issues',
      type: 'PROJECT',
      description: 'Ability to edit issues.',
    },
    {
      key: 'DELETE_ISSUES',
      name: 'Delete Issues',
      type: 'PROJECT',
      description: 'Ability to delete issues.',
    },
    {
      key: 'ASSIGN_ISSUES',
      name: 'Assign Issues',
      type: 'PROJECT',
      description: 'Ability to assign issues to other people.',
    },
    {
      key: 'ASSIGNABLE_USER',
      name: 'Assignable User',
      type: 'PROJECT',
      description: 'Users with this permission may be assigned to issues.',
    },
    {
      key: 'RESOLVE_ISSUES',
      name: 'Resolve Issues',
      type: 'PROJECT',
      description: 'Ability to resolve and reopen issues.',
    },
    {
      key: 'CLOSE_ISSUES',
      name: 'Close Issues',
      type: 'PROJECT',
      description: 'Ability to close issues.',
    },
    {
      key: 'ADD_COMMENTS',
      name: 'Add Comments',
      type: 'PROJECT',
      description: 'Ability to comment on issues.',
    },
    {
      key: 'EDIT_OWN_COMMENTS',
      name: 'Edit Own Comments',
      type: 'PROJECT',
      description: 'Ability to edit own comments.',
    },
    {
      key: 'EDIT_ALL_COMMENTS',
      name: 'Edit All Comments',
      type: 'PROJECT',
      description: 'Ability to edit all comments.',
    },
    {
      key: 'DELETE_OWN_COMMENTS',
      name: 'Delete Own Comments',
      type: 'PROJECT',
      description: 'Ability to delete own comments.',
    },
    {
      key: 'DELETE_ALL_COMMENTS',
      name: 'Delete All Comments',
      type: 'PROJECT',
      description: 'Ability to delete all comments.',
    },
    {
      key: 'CREATE_ATTACHMENTS',
      name: 'Create Attachments',
      type: 'PROJECT',
      description: 'Ability to create attachments.',
    },
    {
      key: 'DELETE_OWN_ATTACHMENTS',
      name: 'Delete Own Attachments',
      type: 'PROJECT',
      description: 'Ability to delete own attachments.',
    },
    {
      key: 'DELETE_ALL_ATTACHMENTS',
      name: 'Delete All Attachments',
      type: 'PROJECT',
      description: 'Ability to delete all attachments.',
    },
    {
      key: 'WORK_ON_ISSUES',
      name: 'Work On Issues',
      type: 'PROJECT',
      description: 'Ability to log work done against an issue.',
    },
    {
      key: 'EDIT_OWN_WORKLOGS',
      name: 'Edit Own Worklogs',
      type: 'PROJECT',
      description: 'Ability to edit own worklogs.',
    },
    {
      key: 'EDIT_ALL_WORKLOGS',
      name: 'Edit All Worklogs',
      type: 'PROJECT',
      description: 'Ability to edit all worklogs.',
    },
    {
      key: 'DELETE_OWN_WORKLOGS',
      name: 'Delete Own Worklogs',
      type: 'PROJECT',
      description: 'Ability to delete own worklogs.',
    },
    {
      key: 'DELETE_ALL_WORKLOGS',
      name: 'Delete All Worklogs',
      type: 'PROJECT',
      description: 'Ability to delete all worklogs.',
    },
    {
      key: 'LINK_ISSUES',
      name: 'Link Issues',
      type: 'PROJECT',
      description: 'Ability to link issues together.',
    },
    {
      key: 'TRANSITION_ISSUES',
      name: 'Transition Issues',
      type: 'PROJECT',
      description: 'Ability to transition issues.',
    },
    {
      key: 'SCHEDULE_ISSUES',
      name: 'Schedule Issues',
      type: 'PROJECT',
      description: 'Ability to view and edit the due date of issues.',
    },
    {
      key: 'MOVE_ISSUES',
      name: 'Move Issues',
      type: 'PROJECT',
      description: 'Ability to move issues between projects.',
    },
    {
      key: 'ADMINISTER_PROJECTS',
      name: 'Administer Projects',
      type: 'PROJECT',
      description: 'Ability to administer a project in Jira.',
    },
    {
      key: 'USER_PICKER',
      name: 'User Picker',
      type: 'GLOBAL',
      description: 'Ability to use the user picker.',
    },
    {
      key: 'MANAGE_WATCHERS',
      name: 'Manage Watchers',
      type: 'PROJECT',
      description: 'Ability to manage the watchers of an issue.',
    },
  ];

  generateUserPermissions(
    _user: User,
    context: GenerationContext
  ): Permission[] {
    const permissions: Permission[] = [];

    // Generate permissions based on user role
    // For simplicity, give most users standard permissions
    const isAdmin = context.faker.datatype.boolean({ probability: 0.1 });
    const isDeveloper = context.faker.datatype.boolean({ probability: 0.6 });

    PermissionGenerator.ALL_PERMISSIONS.forEach(perm => {
      let havePermission = false;

      if (isAdmin) {
        // Admins have all permissions
        havePermission = true;
      } else if (isDeveloper) {
        // Developers have most permissions except admin and delete all
        havePermission = !perm.key.includes('ADMINISTER') &&
          !perm.key.includes('DELETE_ALL');
      } else {
        // Regular users have basic permissions
        havePermission = [
          'BROWSE_PROJECTS',
          'CREATE_ISSUES',
          'EDIT_ISSUES',
          'ADD_COMMENTS',
          'EDIT_OWN_COMMENTS',
          'DELETE_OWN_COMMENTS',
          'CREATE_ATTACHMENTS',
          'DELETE_OWN_ATTACHMENTS',
          'WORK_ON_ISSUES',
          'EDIT_OWN_WORKLOGS',
          'DELETE_OWN_WORKLOGS',
          'LINK_ISSUES',
          'TRANSITION_ISSUES',
        ].includes(perm.key);
      }

      permissions.push({
        id: context.idGenerator.next('permission'),
        key: perm.key,
        name: perm.name,
        type: perm.type,
        description: perm.description,
        havePermission,
      });
    });

    return permissions;
  }

  getPermission(key: string, havePermission: boolean, context: GenerationContext): Permission {
    const perm = PermissionGenerator.ALL_PERMISSIONS.find(p => p.key === key);

    if (perm) {
      return {
        id: context.idGenerator.next('permission'),
        key: perm.key,
        name: perm.name,
        type: perm.type,
        description: perm.description,
        havePermission,
      };
    }

    // Unknown permission
    return {
      id: context.idGenerator.next('permission'),
      key,
      name: key,
      type: 'PROJECT',
      description: `Permission for ${key}`,
      havePermission: false,
    };
  }
}
