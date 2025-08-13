CREATE TABLE Categories (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(255) NOT NULL UNIQUE,
    ImageURL NVARCHAR(MAX)
);

CREATE TABLE Products (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(255) NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    CategoryId INT NOT NULL,
    ImageURL NVARCHAR(MAX),
    FOREIGN KEY (CategoryId) REFERENCES Categories(Id)
);

CREATE TABLE Orders (
    Id INT PRIMARY KEY IDENTITY(1,1),
    OrderDate DATETIME DEFAULT GETDATE(),
    CustomerName NVARCHAR(255),
    Address NVARCHAR(MAX),
    Landmark NVARCHAR(255),
    City NVARCHAR(255),
    Pincode NVARCHAR(10),
    Phone NVARCHAR(15),
    Total DECIMAL(10,2)
	Email NVARCHAR(255)
);
CREATE TABLE OrderItems (
    Id INT PRIMARY KEY IDENTITY(1,1),
    OrderId INT FOREIGN KEY REFERENCES Orders(Id),
    ProductName NVARCHAR(255),
    Quantity INT,
    Subtotal DECIMAL(10,2)
);
CREATE TABLE Visitors (
    Id INT PRIMARY KEY IDENTITY(1,1),
    VisitDate DATETIME DEFAULT GETDATE(),
    IPAddress NVARCHAR(50)
);

CREATE TABLE contacts (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(255),
  email NVARCHAR(255),
  phone NVARCHAR(50),
  subject NVARCHAR(255),
  message NVARCHAR(MAX),
  submitted_at DATETIME DEFAULT GETDATE()
);
-- Optional index for faster lookups
CREATE INDEX IX_contacts_Email ON contacts(Email);

CREATE TABLE dbo.admin_users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
);
ALTER TABLE admin_users
ADD CONSTRAINT UQ_username UNIQUE (username);