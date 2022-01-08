
-- Users --
INSERT INTO users (name, age, gender) VALUES ('Eric', 20, 'He');

-- Activity Type. 1 is physical, 2 is mental --
INSERT INTO activity_type (name, category) VALUES ('Swim', 1);
INSERT INTO activity_type (name, category) VALUES ('Run', 1);
INSERT INTO activity_type (name, category) VALUES ('Bike', 1);
INSERT INTO activity_type (name, category) VALUES ('Weights', 1);
INSERT INTO activity_type (name, category) VALUES ('Yoga', 1);

INSERT INTO activity_type (name, category) VALUES ('Mediate', 2);
INSERT INTO activity_type (name, category) VALUES ('Daily Journal', 2);
INSERT INTO activity_type (name, category) VALUES ('Breathing', 2);
INSERT INTO activity_type (name, category) VALUES ('Gratitude', 2);
INSERT INTO activity_type (name, category) VALUES ('Reading', 2);

-- Mood --
INSERT INTO mood (name, rating) VALUES ('Calm', 7);
INSERT INTO mood (name, rating) VALUES ('Thankful', 9);
INSERT INTO mood (name, rating) VALUES ('Confident', 10);
INSERT INTO mood (name, rating) VALUES ('Refreshed', 8);
INSERT INTO mood (name, rating) VALUES ('Mellow', 6);
INSERT INTO mood (name, rating) VALUES ('Anxious', 4);
INSERT INTO mood (name, rating) VALUES ('Disappointed', 3);
INSERT INTO mood (name, rating) VALUES ('Restless', 5);
INSERT INTO mood (name, rating) VALUES ('Frustrated', 2);
INSERT INTO mood (name, rating) VALUES ('Hopeless', 1);


-- Quotes. 1 is physical, 2 is mental--
INSERT INTO quotes (quote, type) VALUES ('The only bad workout is the one that did not happen.', 1);
INSERT INTO quotes (quote, type) VALUES ('The body achieves what the mind believes.', 1);
INSERT INTO quotes (quote, type) VALUES ('Take care of your body. It''s the only place you have to live in.', 1);
INSERT INTO quotes (quote, type) VALUES ('Every workout counts even if it''s only for 15 minutes. Just do it.', 1);

INSERT INTO quotes (quote, type) VALUES ('There is a crack in everything, that''s how the light gets in.', 2);
INSERT INTO quotes (quote, type) VALUES ('Happiness can be found even in the darkest of times, if one only remembers to turn on the light.', 2);
INSERT INTO quotes (quote, type) VALUES ('The best way out is always through.', 2);
INSERT INTO quotes (quote, type) VALUES ('Just when the caterpillar thought the world was ending, he turned into a butterfly.', 2);


-- Activity --

INSERT INTO activity (user_id, date, activity_type, free_text) VALUES (1, '2020-12-25', 1, 'Went for swim after a long day of work.');
INSERT INTO activity (user_id, date, activity_type, free_text) VALUES (1, '2020-12-25', 10, 'Reading Harry Potter');
INSERT INTO activity (user_id, date, activity_type, free_text) VALUES (1, '2020-12-26', 5, 'Did yoga with friends');


-- Activity_mood --
INSERT INTO activity_mood (activity_id, mood_id) VALUES (1,8);
INSERT INTO activity_mood (activity_id, mood_id) VALUES (1,3);
INSERT INTO activity_mood (activity_id, mood_id) VALUES (2,6);
INSERT INTO activity_mood (activity_id, mood_id) VALUES (3,7);