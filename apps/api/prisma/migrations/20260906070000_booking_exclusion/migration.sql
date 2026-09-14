-- Authoritative double-booking prevention.
-- Two bookings for the SAME companion with OVERLAPPING time ranges cannot
-- coexist while either occupies the companion's calendar. Timestamps are
-- stored in UTC; tsrange() over them is IMMUTABLE and indexable with GiST.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_double_booking"
  EXCLUDE USING gist (
    "companionProfileId" WITH =,
    tsrange("startAt", "endAt") WITH &&
  ) WHERE ("status" IN ('CONFIRMED', 'IN_PROGRESS', 'PENDING_PAYMENT'));
