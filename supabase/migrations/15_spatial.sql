-- Système de référence spatial (pour PostGIS)
CREATE TABLE public.spatial_ref_sys (
  srid integer NOT NULL CHECK (srid > 0 AND srid <= 998999) PRIMARY KEY,
  auth_name character varying,
  auth_srid integer,
  srtext character varying,
  proj4text character varying
);