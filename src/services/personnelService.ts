import { supabase } from "../lib/supabase";

export interface Permission {
  id: string;
  label: string;
  category: "users" | "finance" | "support" | "settings" | "operations";
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  is_system?: boolean; // Cannot be deleted if true
  role_family?: "admin" | "forwarder" | "client"; // The base family this role belongs to
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string; // Role ID or Name
  status: "active" | "inactive";
  last_active: string;
  avatar?: string;
  client_tier?: "bronze" | "silver" | "gold" | "platinum";
  kyc_status?: "pending" | "approved" | "rejected" | "verified";
  role_details?: Role;
  transport_modes?: string[];
}

export interface Profile {
  id: string;
  full_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  role: string;
  avatar_url?: string;
  created_at?: string;
  account_status?: string;
  kyc_status?: string;
  transport_modes?: string[];
}

const PERMISSIONS: Permission[] = [
  // 📦 Shipments
  {
    id: "shipments.view",
    label: "Voir les expéditions",
    category: "operations",
  },
  {
    id: "shipments.create",
    label: "Créer des expéditions",
    category: "operations",
  },
  {
    id: "shipments.edit",
    label: "Modifier les expéditions",
    category: "operations",
  },
  {
    id: "shipments.delete",
    label: "Supprimer des expéditions",
    category: "operations",
  },
  {
    id: "shipments.status",
    label: "Changer le statut",
    category: "operations",
  },

  // 👥 Personnel
  { id: "personnel.view", label: "Voir le personnel", category: "users" },
  { id: "personnel.create", label: "Ajouter du personnel", category: "users" },
  { id: "personnel.edit", label: "Modifier le personnel", category: "users" },
  {
    id: "personnel.delete",
    label: "Supprimer du personnel",
    category: "users",
  },
  { id: "personnel.roles", label: "Gérer les rôles", category: "users" },

  // 💰 Finance
  {
    id: "finance.view",
    label: "Voir le tableau de bord financier",
    category: "finance",
  },
  { id: "finance.create", label: "Créer devis/factures", category: "finance" },
  {
    id: "finance.payments",
    label: "Enregistrer des paiements",
    category: "finance",
  },
  {
    id: "finance.reports",
    label: "Exporter des rapports",
    category: "finance",
  },

  // 🎫 Support
  { id: "support.view", label: "Voir les tickets", category: "support" },
  { id: "support.respond", label: "Répondre aux tickets", category: "support" },
  {
    id: "support.manage",
    label: "Gérer les tickets (Fermer/Supprimer)",
    category: "support",
  },

  // ⚙️ Settings
  { id: "settings.view", label: "Voir la configuration", category: "settings" },
  {
    id: "settings.manage",
    label: "Modifier les paramètres système",
    category: "settings",
  },
];

export type RoleFamilyType = "admin" | "forwarder" | "client" | "custom"; // Custom is UI only now, effectively maps to one of the 3

export const ROLE_FAMILIES: Record<
  RoleFamilyType,
  { label: string; permissions: string[] }
> = {
  admin: {
    label: "Administrateur",
    permissions: [
      "shipments.view",
      "shipments.create",
      "shipments.edit",
      "shipments.delete",
      "shipments.status",
      "personnel.view",
      "personnel.create",
      "personnel.edit",
      "personnel.delete",
      "personnel.roles",
      "finance.view",
      "finance.create",
      "finance.payments",
      "finance.reports",
      "support.view",
      "support.respond",
      "support.manage",
      "settings.view",
      "settings.manage",
    ],
  },
  forwarder: {
    label: "Transitaire",
    permissions: [
      "shipments.view",
      "shipments.create",
      "shipments.edit",
      "shipments.status",
      "personnel.view",
      "personnel.create",
      "personnel.edit",
      "finance.view",
      "finance.create",
      "finance.reports",
      "support.view",
      "support.respond",
    ],
  },
  client: {
    label: "Client",
    permissions: [
      "shipments.view",
      "shipments.create",
      "finance.view",
      "support.view",
      "support.respond",
    ],
  },
  custom: {
    label: "Personnalisé",
    permissions: [],
  },
};

export const personnelService = {
  getStaff: async (): Promise<StaffMember[]> => {
    // Fetch profiles that have a staff_role_id OR are admins
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
                id,
                full_name,
                email,
                role,
                account_status,
                last_sign_in_at,
                avatar_url,
                staff_role:staff_roles(*)
            `,
      )
      .or("role.eq.admin,role.eq.super-admin,staff_role_id.not.is.null");

    if (error) throw error;

    return (data || []).map(mapDbProfileToStaff);
  },

  getForwarderStaff: async (): Promise<StaffMember[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
                id,
                full_name,
                email,
                role,
                account_status,
                last_sign_in_at,
                avatar_url,
                staff_role:staff_roles(*)
            `,
      )
      .eq("forwarder_id", user.id);

    if (error) throw error;

    return (data || []).map(mapDbProfileToStaff);
  },

  getForwarders: async (): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "forwarder")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getClients: async (): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "client")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  updateForwarderStatus: async (
    id: string,
    updates: {
      kyc_status?: string;
      subscription_status?: string;
      subscription_plan?: string;
    },
  ): Promise<void> => {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
  },

  addForwarderStaff: async (
    staff: Omit<StaffMember, "id" | "last_active">,
  ): Promise<StaffMember> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Call the Edge Function to create the user
    const { data, error } = await supabase.functions.invoke("create-user", {
      body: {
        email: staff.email,
        password: "TempPassword123!", // In a real app, generate a random one or send invite
        fullName: staff.name,
        role: staff.role, // 'driver', 'staff', etc.
        metadata: {
          forwarder_id: user.id, // Link to the creating forwarder
        },
      },
    });

    if (error) {
      console.error("Edge Function Error:", error);
      throw new Error(error.message || "Error creating user");
    }

    if (data.error) throw new Error(data.error);
    if (data.emailError) {
      const errMsg =
        typeof data.emailError === "object"
          ? JSON.stringify(data.emailError)
          : data.emailError;
      throw new Error(
        `Utilisateur créé mais échec de l'envoi email: ${errMsg}`,
      );
    }

    // Return the created staff member structure
    return {
      id: data.user.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      status: "active",
      last_active: new Date().toISOString(),
      avatar: undefined,
    };
  },

  addStaff: async (
    staff: Omit<StaffMember, "id" | "last_active">,
  ): Promise<StaffMember> => {
    // Re-use the same logic or separate if Admin needs different params
    return personnelService.addForwarderStaff(staff);
  },

  // Alias for addStaff to match interface usage in some components
  addStaffMember: async (
    data: Omit<StaffMember, "id" | "last_active">,
  ): Promise<StaffMember> => {
    return personnelService.addStaff(data);
  },

  updateStatus: async (id: string, status: string): Promise<void> => {
    const { error } = await supabase
      .from("profiles")
      .update({ account_status: status })
      .eq("id", id);

    if (error) throw error;
  },

  updateStaff: async (
    id: string,
    data: Partial<StaffMember>,
  ): Promise<StaffMember> => {
    // Map staff fields to profile fields
    const updates: any = {};
    if (data.name) updates.full_name = data.name;
    if (data.email) updates.email = data.email; // Changing email might require re-verification
    if (data.status) updates.account_status = data.status;

    // If role is updated, we need to handle staff_role_id
    // This assumes data.role is the Role ID
    if (data.role) {
      updates.staff_role_id = data.role;
    }

    const { data: updated, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select(
        `
                *,
                staff_role:staff_roles(*)
            `,
      )
      .single();

    if (error) throw error;
    return mapDbProfileToStaff(updated);
  },

  // Roles & Permissions Methods
  getRoles: async (): Promise<Role[]> => {
    const { data, error } = await supabase
      .from("staff_roles")
      .select("*")
      .order("name");

    if (error) throw error;
    return (data || []).map(mapDbRoleToApp);
  },

  getAssignableRoles: async (
    userFamily: "admin" | "forwarder",
  ): Promise<Role[]> => {
    const { data, error } = await supabase
      .from("staff_roles")
      .select("*")
      .order("name");

    if (error) throw error;

    const allRoles = (data || []).map(mapDbRoleToApp);

    if (userFamily === "admin") {
      return allRoles;
    } else {
      // Filter strictly for Forwarders
      return allRoles.filter((role) => role.role_family === "forwarder");
    }
  },

  getPermissions: async (): Promise<Permission[]> => {
    // Permissions are static for now, but could be DB driven
    return PERMISSIONS;
  },

  addRole: async (role: Omit<Role, "id">): Promise<Role> => {
    // Generate a slug-like ID from the name
    const id = role.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data, error } = await supabase
      .from("staff_roles")
      .insert({
        id: id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        is_system: false,
      })
      .select()
      .single();

    if (error) throw error;
    return mapDbRoleToApp(data);
  },

  updateRole: async (id: string, data: Partial<Role>): Promise<Role> => {
    const { data: updated, error } = await supabase
      .from("staff_roles")
      .update({
        name: data.name,
        description: data.description,
        permissions: data.permissions,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapDbRoleToApp(updated);
  },

  deleteRole: async (id: string): Promise<void> => {
    const { error } = await supabase.from("staff_roles").delete().eq("id", id);

    if (error) throw error;
  },
};

function mapDbProfileToStaff(dbRecord: any): StaffMember {
  const staffRole = Array.isArray(dbRecord.staff_role)
    ? dbRecord.staff_role[0]
    : dbRecord.staff_role;
  return {
    id: dbRecord.id,
    name: dbRecord.full_name || "Inconnu",
    email: dbRecord.email,
    role: staffRole?.id || dbRecord.role, // Use staff role ID if available, else profile role
    status: dbRecord.account_status || "active",
    last_active: dbRecord.last_sign_in_at || new Date().toISOString(),
    avatar: dbRecord.avatar_url,
    role_details: staffRole ? mapDbRoleToApp(staffRole) : undefined,
    transport_modes: dbRecord.transport_modes || [],
    client_tier: dbRecord.client_tier,
    kyc_status: dbRecord.kyc_status,
  };
}

function mapDbRoleToApp(dbRecord: any): Role {
  return {
    id: dbRecord.id,
    name: dbRecord.name,
    description: dbRecord.description,
    permissions: dbRecord.permissions || [],
    is_system: dbRecord.is_system,
    role_family: dbRecord.role_family,
  };
}
