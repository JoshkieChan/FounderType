-- Create admin delete function that bypasses RLS
CREATE OR REPLACE FUNCTION admin_delete_commitment(commitment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM commitments WHERE id = commitment_id;
END;
$$;

-- Grant execution rights to authenticated users  
GRANT EXECUTE ON FUNCTION admin_delete_commitment(UUID) TO authenticated;
