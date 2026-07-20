-- Minimal SQL-only seed: Big Brother 28 season + the real 16-person cast.
-- (Demo users + demo league need the auth admin API — use `npm run seed` for the full demo.)
-- Image URLs hotlink the Big Brother Fandom wiki's "_Large" portrait headshots
-- (static.wikia.nocookie.net — a separate, unprotected CDN from the
-- Cloudflare-gated wiki pages) as a fallback; re-host them in the
-- houseguest-images Storage bucket for production use. Rick Devens has no
-- photo on the wiki yet, so his hotlink stays on Big Brother Network.
insert into public.seasons (name, created_by)
select 'Big Brother 28', null
where not exists (select 1 from public.seasons where name = 'Big Brother 28');

insert into public.houseguests (season_id, name, age, hometown, occupation, image_url)
select s.id, v.name, v.age, v.hometown, v.occupation, v.image_url
from public.seasons s,
(values
  ('Dee Valladares', 29, 'Miami, FL', 'Entrepreneur (Survivor winner)', null),
  ('Barrett Pfeiffer', 27, 'Benton, AR', 'Jumbotron Engineer', 'https://static.wikia.nocookie.net/bigbrother/images/f/f2/US28_Barrett_Large.jpg'),
  ('Chuk Anyanwu', 27, 'Dallas, TX', 'Supply Chain Analyst', 'https://static.wikia.nocookie.net/bigbrother/images/8/8c/US28_Chuk_Large.jpg'),
  ('Drew Campbell', 22, 'Temecula, CA', 'Surgical Dental Assistant', 'https://static.wikia.nocookie.net/bigbrother/images/2/2b/US28_Drew_Large.jpg'),
  ('Haley Thogmartin', 29, 'Neosho, MO', 'Telemedicine Executive', 'https://static.wikia.nocookie.net/bigbrother/images/6/61/US28_Haley_Large.jpg'),
  ('Jason De Puy', 35, 'San Francisco, CA', 'Drag Queen (Salina EsTitties)', 'https://static.wikia.nocookie.net/bigbrother/images/e/e5/US28_Jason_Large.jpg'),
  ('Kamu Kirk', 32, 'Phoenix, AZ', 'MMA Fighter', 'https://static.wikia.nocookie.net/bigbrother/images/0/0e/US28_Kamu_Large.jpg'),
  ('LaTrice Verrett', 57, 'Kankakee, IL', 'Boutique Salesperson', 'https://static.wikia.nocookie.net/bigbrother/images/0/0a/US28_LaTrice_Large.jpg'),
  ('Lyric Medeiros', 25, 'Honolulu, HI', 'Attorney', 'https://static.wikia.nocookie.net/bigbrother/images/8/8f/US28_Lyric_Large.jpg'),
  ('Mallory Aurichio', 24, 'Township of Washington, NJ', 'Rocket Scientist', 'https://static.wikia.nocookie.net/bigbrother/images/1/11/US28_Mallory_Large.jpg'),
  ('Melody Morris', 24, 'Thornton, CO', 'Corporate Game Show Host', 'https://static.wikia.nocookie.net/bigbrother/images/f/f6/US28_Melody_Large.jpg'),
  ('Rome Seymour', 28, 'Traverse City, MI', 'Pickleball Coach', 'https://static.wikia.nocookie.net/bigbrother/images/1/10/US28_Rome_Large.jpg'),
  ('Taylor Brown', 27, 'Deerfield Beach, FL', 'Elementary School Counselor', 'https://static.wikia.nocookie.net/bigbrother/images/d/d7/US28_Taylor_Large.jpg'),
  ('Yash Patel', 24, 'Monroe Township, NJ', 'Financial Analyst', 'https://static.wikia.nocookie.net/bigbrother/images/a/a2/US28_Yash_Large.jpg'),
  ('Rick Devens', 42, 'Macon, GA', 'News Anchor (Survivor vet)', 'https://bigbrothernetwork.com/wp-content/uploads/2026/07/survivor-rick-devens-00.jpg'),
  ('Angela Murray', 53, 'Syracuse, UT', 'Real Estate Agent (BB26 vet)', 'https://static.wikia.nocookie.net/bigbrother/images/3/3b/US26_Angela_Large.jpg')
) as v(name, age, hometown, occupation, image_url)
where s.name = 'Big Brother 28'
  and not exists (
    select 1 from public.houseguests h where h.season_id = s.id and h.name = v.name
  );
