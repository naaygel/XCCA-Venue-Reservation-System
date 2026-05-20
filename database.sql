CREATE TABLE Users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  fullName NVARCHAR(150) NOT NULL,
  username NVARCHAR(100) NOT NULL UNIQUE,
  passwordHash NVARCHAR(255) NOT NULL,
  studentId NVARCHAR(100) NOT NULL,
  role NVARCHAR(20) NOT NULL DEFAULT 'user',
  createdAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Reservations (
  id INT IDENTITY(1,1) PRIMARY KEY,
  userId INT NOT NULL,
  fullName NVARCHAR(150) NOT NULL,
  eventName NVARCHAR(150) NOT NULL,
  venue NVARCHAR(150) NOT NULL,
  reservationDate DATE NOT NULL,
  startTime TIME NOT NULL,
  endTime TIME NOT NULL,
  organizationName NVARCHAR(150) NOT NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
  createdAt DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_Reservations_Users
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Create an admin account after deployment by registering normally,
-- then run this query using that username:
-- UPDATE Users SET role = 'admin' WHERE username = 'your_admin_username';
