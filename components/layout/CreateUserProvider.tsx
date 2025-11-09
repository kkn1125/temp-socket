'use client';

import { useState, useEffect } from 'react';
import { CreateUserModal } from './CreateUserModal';
import { useUser } from '@/contexts/UserContext';

export function CreateUserProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setShowCreateModal(true);
    } else {
      setShowCreateModal(false);
    }
  }, [user, loading]);

  const handleUserCreated = async () => {
    setShowCreateModal(false);
  };

  if (loading) {
    return null;
  }

  return (
    <>
      {children}
      <CreateUserModal open={showCreateModal} onClose={handleUserCreated} />
    </>
  );
}

