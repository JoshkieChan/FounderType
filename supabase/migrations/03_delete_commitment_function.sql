-- Create function to delete commitment with proper permissions
CREATE OR REPLACE FUNCTION delete_commitment(commitment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM commitments WHERE id = commitment_id;
END;
$$;

-- Grant execution rights to authenticated users
GRANT EXECUTE ON FUNCTION delete_commitment(UUID) TO authenticated;
