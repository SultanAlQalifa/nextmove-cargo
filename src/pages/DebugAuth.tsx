import { useAuth } from '../contexts/AuthContext';

export default function DebugAuth() {
    const { user, profile, loading } = useAuth();

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">Debug Auth Info</h1>

            <div className="bg-white shadow rounded-lg p-6 space-y-4">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Loading State</h2>
                    <p className="text-gray-700">Loading: {loading ? 'Yes' : 'No'}</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">User Info</h2>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto">
                        {JSON.stringify(user, null, 2)}
                    </pre>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">Profile Info</h2>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto">
                        {JSON.stringify(profile, null, 2)}
                    </pre>
                </div>

                {profile && (
                    <div className="mt-4 p-4 bg-blue-50 rounded">
                        <p className="font-semibold">Your role: <span className="text-blue-600">{profile.role}</span></p>
                        <p className="mt-2">You should be redirected to: <span className="font-mono">/dashboard/{profile.role === 'super-admin' || profile.role === 'admin' ? 'admin' : profile.role}</span></p>
                    </div>
                )}
            </div>
        </div>
    );
}
