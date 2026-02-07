export const signUpQuery = `
  INSERT INTO users (email, password, firstname, lastname) 
  VALUES ($1, $2, $3, $4) 
  RETURNING id, email;
`;

export const isUserExist  = `SELECT id, email FROM users WHERE id = $1`

export const loginQuery = `SELECT id, password, firstname FROM users WHERE email = $1`

export const createInstanceQuery = `
  INSERT INTO instances (containerId, port, password, instanceUSER, overhead) VALUES ($1, $2, $3, $4, $5)
  RETURNING id, port, password, instanceUSER;
`

export const isUserExistByEmail = `
  SELECT id FROM users WHERE email = $1
`

export const fetchInstances = `
SELECT * FROM instances WHERE instanceUSER = $1;
`

export const fetchActives = `
SELECT createdat, port FROM instances WHERE status = 'RUNNING';
`

export const fetchUserName = `
SELECT firstname, lastname, createdat FROM USERS WHERE id = $1;
`

export const fetchUserInstances = `
SELECT port, status, createdat FROM INSTANCES WHERE instanceUser = $1;
`