ALTER TABLE notes
add column folder_Id INTEGER REFERENCES folders(id);