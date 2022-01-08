SELECT activity.id, activity.date, activity_type.name, activity.free_text, activity_type.category
FROM activity 
INNER JOIN activity_type 
ON activity.activity_type = activity_type.id


SELECT activity.id, activity.date, activity_type.name, activity.free_text, activity_type.category
FROM activity 
INNER JOIN activity_type 
ON activity.activity_type = activity_type.id
WHERE activity.id=${selectedNote}