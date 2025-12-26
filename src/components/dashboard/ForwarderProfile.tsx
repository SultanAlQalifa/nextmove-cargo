import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { forwarderService } from "../../services/forwarderService";
import { subscriptionService } from "../../services/subscriptionService";
import StarRating from "../common/StarRating";
import { reviewService, Review } from "../../services/reviewService";

export default function ForwarderProfile() {
  const { user, profile } = useAuth();
  const { success, error: toastError } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const { register, handleSubmit } = useForm();

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

      // Fetch reviews
      const reviewsData = await reviewService.getForwarderReviews(user.id);
      setReviews(reviewsData);

    } catch (error) {
      console.error("Error loading details:", error);
    }
  };

  const onSubmit = async () => {
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
          <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
            Company Name
          </label>
          <input
            id="company_name"
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


      {/* Reviews Section */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Avis Clients</h3>

        <div className="flex items-center gap-4 mb-8 bg-gray-50 p-4 rounded-xl">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {/* @ts-ignore */}
              {(profile?.rating || 0).toFixed(1)}
            </div>
            <StarRating rating={
              /* @ts-ignore */
              profile?.rating || 0
            } size="sm" />
            <div className="text-xs text-gray-500 mt-1">
              {/* @ts-ignore */}
              {profile?.review_count || 0} avis
            </div>
          </div>
          <div className="h-12 w-px bg-gray-300 mx-4"></div>
          <div className="text-sm text-gray-600">
            Votre note est visible par les clients lors de la comparaison des offres.
            Une bonne note augmente vos chances d'être choisi !
          </div>
        </div>

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-gray-500 italic text-center py-4">Aucun avis pour le moment.</p>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  < StarRating rating={review.rating} size="sm" />
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{review.comment || "Pas de commentaire."}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div >
  );
}
