
--Users --
INSERT INTO users (name, age, gender, password, hashed_password, photo) VALUES ('Spiderman', 20, 'He', 'testing', '521b9ccefbcd14d179e7a1bb877752870a6d620938b28a66a107eac6e6805b9d0989f45b5730508041aa5e710847d439ea74cd312c9355f1f2dae08d40e41d50','spiderman.png');
INSERT INTO users (name, age, gender, password, hashed_password, photo) VALUES ('Groot', 2, 'Non-binary', 'testing', '521b9ccefbcd14d179e7a1bb877752870a6d620938b28a66a107eac6e6805b9d0989f45b5730508041aa5e710847d439ea74cd312c9355f1f2dae08d40e41d50','groot.png');


-- Activity Type. 1 is physical, 2 is mental --
INSERT INTO activity_type (name, category, icon) VALUES ('Swim', 1, 'fas fa-swimmer');
INSERT INTO activity_type (name, category, icon) VALUES ('Run', 1, 'fas fa-running');
INSERT INTO activity_type (name, category, icon) VALUES ('Bike', 1,'fas fa-biking');
INSERT INTO activity_type (name, category, icon) VALUES ('Yoga', 1, 'fas fa-praying-hands');

INSERT INTO activity_type (name, category, icon) VALUES ('Meditate', 2, 'fas fa-pray');
INSERT INTO activity_type (name, category, icon) VALUES ('Journal', 2, 'fas fa-pencil-alt');
INSERT INTO activity_type (name, category, icon) VALUES ('Breathe', 2, 'fas fa-wind');
INSERT INTO activity_type (name, category, icon) VALUES ('Read', 2, 'fas fa-book-open');

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
INSERT INTO quotes (quote, type) VALUES ('Self-care is giving the world the best of you, instead of what''s left of you.', 1);
INSERT INTO quotes (quote, type) VALUES ('The body achieves what the mind believes.', 1);
INSERT INTO quotes (quote, type) VALUES ('Take care of your body. It''s the only place you have to live in.', 1);
INSERT INTO quotes (quote, type) VALUES ('Exercise not only changes your body. It changes your mind, your attitude and your mood.', 1);

INSERT INTO quotes (quote, type) VALUES ('There is a crack in everything, that''s how the light gets in.', 2);
INSERT INTO quotes (quote, type) VALUES ('Happiness can be found even in the darkest of times, if one only remembers to turn on the light.', 2);
INSERT INTO quotes (quote, type) VALUES ('The best way out is always through.', 2);
INSERT INTO quotes (quote, type) VALUES ('Just when the caterpillar thought the world was ending, he turned into a butterfly.', 2);


-- Activity --

INSERT INTO activity (user_id, date, activity_type, free_text) VALUES (1, '2022-10-04', 1, 'Went for swim after a long day of work.');
INSERT INTO activity (user_id, date, activity_type, free_text) VALUES (1, '2022-10-08', 8, 'Reading Harry Potter');
INSERT INTO activity (user_id, date, activity_type, free_text) VALUES (1, '2022-10-08', 4, 'Did yoga with friends');
INSERT INTO activity (user_id, date, activity_type, free_text) VALUES (1, '2022-10-06', 3, 'Cycle 50km');
INSERT INTO activity (user_id, date, activity_type, free_text) VALUES (1, '2022-10-07', 5, 'Reflecting on the day');
INSERT INTO activity (user_id, date, activity_type, free_text) VALUES (2, '2022-10-08', 2, 'Run baby run');
INSERT INTO activity (user_id, date, activity_type, free_text) VALUES (2, '2022-10-08', 7, 'Outdoor walk');
INSERT INTO activity (user_id, date, activity_type, free_text) VALUES (2, '2022-10-06', 4, 'Yoga movement 5pm');
INSERT INTO activity (user_id, date, activity_type, free_text) VALUES (2, '2022-10-07', 1, 'Swimming like a fish');
INSERT INTO activity (user_id, date, activity_type, free_text) VALUES (2, '2022-10-09', 5, 'Reflecting on the day');


-- Activity_mood --
INSERT INTO activity_mood (activity_id, mood_id) VALUES (1,8);
INSERT INTO activity_mood (activity_id, mood_id) VALUES (1,3);
INSERT INTO activity_mood (activity_id, mood_id) VALUES (2,6);
INSERT INTO activity_mood (activity_id, mood_id) VALUES (3,7);
INSERT INTO activity_mood (activity_id, mood_id) VALUES (4,1);
INSERT INTO activity_mood (activity_id, mood_id) VALUES (5,2);
INSERT INTO activity_mood (activity_id, mood_id) VALUES (5,4);
INSERT INTO activity_mood (activity_id, mood_id) VALUES (6,2);
INSERT INTO activity_mood (activity_id, mood_id) VALUES (7,4);
INSERT INTO activity_mood (activity_id, mood_id) VALUES (7,8);
INSERT INTO activity_mood (activity_id, mood_id) VALUES (8,3);
INSERT INTO activity_mood (activity_id, mood_id) VALUES (9,5);
INSERT INTO activity_mood (activity_id, mood_id) VALUES (10,8);