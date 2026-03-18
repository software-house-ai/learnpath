CREATE OR REPLACE FUNCTION update_content_rating(content_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE content_items
  SET 
    rating_avg = (SELECT AVG(rating) FROM content_ratings WHERE content_item_id = content_id),
    rating_count = (SELECT COUNT(*) FROM content_ratings WHERE content_item_id = content_id)
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
