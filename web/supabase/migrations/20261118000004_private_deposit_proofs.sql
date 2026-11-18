-- Make the money-related file bucket private.
--
-- `deposit-proofs` holds deposit screenshots, expense receipts, update and
-- sale photos and remittance proofs. It was public (anyone with a link could
-- read) and allowed anonymous uploads. The app now uploads only from the
-- server (service role) and shows files through short-lived signed URLs, so
-- both public access and the anonymous upload policy are removed.

update storage.buckets
   set public = false,
       file_size_limit = 8388608,  -- 8 MB, matches the server check
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'deposit-proofs';

drop policy if exists "Allow uploads to deposit-proofs" on storage.objects;
drop policy if exists "Public read access for deposit proofs" on storage.objects;
