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

export const fetchInstance = `
SELECT containerId, password, status, createdat FROM INSTANCES WHERE instanceUser = $1 AND port = $2 AND status = 'RUNNING';
`

export const privilegeCheck = `
SELECT id, instanceUSER, containerId FROM INSTANCES WHERE port = $1 AND status = 'RUNNING';
`

export const setStopped = `
UPDATE instances SET status = 'STOPPED' WHERE id = $1;
`