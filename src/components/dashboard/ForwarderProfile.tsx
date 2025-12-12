import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { forwarderService } from "../../services/forwarderService";
import { subscriptionService } from "../../services/subscriptionService";

export default function ForwarderProfile() {
  const { user, profile } = useAuth();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, setValue } = useForm();

  useEffect(() => {
    if (user) loadDetails();
  }, [user]);

  const loadDetails = async () => {
    if (!user) return;
    try {
      // In a real app, we would have a getForwarderByUserId or similar
      // For now, we filter the list
      const forwarders = await forwarderService.getForwarders();
      const details = forwarders.find((f) => f.id === user.id); // Assuming user.id matches forwarder.id for mock
      if (details) {
        // setValue('bio', details.bio); // Bio not in ForwarderProfile yet, ignoring
      }
    } catch (error) {
      console.error("Error loading details:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!user) return;
    try {
      await forwarderService.updateForwarder(user.id, {
        // bio: data.bio
      });
      success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toastError("Failed to update profile.");
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Company Profile</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Company Name
          </label>
          <input
            type="text"
            disabled
            value={profile?.company_name || ""}
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Managed in account settings
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Bio / Description
          </label>
          <textarea
            {...register("bio")}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            placeholder="Describe your services..."
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={async () => {
              if (!user) return;
              try {
                await subscriptionService.subscribeToPlan(user.id, "2"); // Test with Pro plan
                success(
                  "Subscription contract generated! Check console for email log.",
                );
              } catch (e) {
                console.error(e);
                toastError("Error generating contract");
              }
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
          >
            Test Subscription Contract
          </button>
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
