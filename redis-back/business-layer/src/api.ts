import express from 'express';
import { z } from 'zod'
import { mailVarification } from './mail.js';
import { createInstance } from "@redis/service/root/manager.js"
import { validateCode } from './db.js';
import type { Request, Response, NextFunction } from 'express';
import pool from './db/index.js';
import bcrypt from "bcrypt";
import type { JwtPayload } from 'jsonwebtoken'
import jwt from 'jsonwebtoken'
import { createInstanceQuery, fetchActives, fetchInstances, isUserExist, isUserExistByEmail, loginQuery, signUpQuery } from './db/queries.js';

export const app = express();

const mailSchema = z.object({
  email : z.string().email()
});

const signUpSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
  passcode: z.string()
});

const signInSchema = z.object({
  email : z.string().email(),
  password : z.string()
})

type instance = {
  port : number, 
  status : string, 
  date : Date
}

const saltRounds : number = Number(process.env.SHIFT)
const secret = process.env.SECRET

if (!secret) {
  throw new Error("JWT_SECRET not defined");
}

if (!saltRounds || isNaN(saltRounds)) {
  throw new Error("Invalid bcrypt salt rounds");
}



app.use(express.json());

/*

- signup (✅)
- signin (✅)
- signout (✅)
- create instance (✅)
- fetch instaces => Will Create After DB SETUP
- fetch instance => Will Create After DB SETUP
  ( usage, date )
- fetch instance data ( hashMaps & queues ) => Will Create After DB SETUP

*/

interface AuthPayload extends JwtPayload {
  userId: string;
  email: string;
  firstName: string;
}

const verifyToken = async (req : Request, res : Response, next : NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).send({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if(!token){
    return res.status(401).send({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(
      token,
      secret
    ) as AuthPayload;

    const result = await pool.query(
      isUserExist,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).send({
        message: "Invalid email or password"
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.firstName
    };

    next();
  } catch (err) {
    return res.status(401).send({ message: "Invalid token" });
  }
}

app.post("/signup", async (req, res) => {
    const data = req.body; 
    const parseResult = mailSchema.safeParse(data);

    if(!parseResult.success){
      res.status(400).send({
        message : "Invalid Credentials"
      });
      return;
    }
    
    const {email} = data;
    const existing = await pool.query(isUserExistByEmail, [email]);

    if (existing.rows.length > 0) {
      return res.status(409).send({
        message: "User already exists"
      });
    }

    const mailState = await mailVarification(email);

    if(mailState.status == "error-mail"){
      return res.status(400).send({
        message : "Error While Sending Code, Please Try Later or use different mail id"
      })
    }

    return res.status(200).send({
      message : "Code is Being Shared To Your Mail Id Please Check!"
    })
    
})

app.post("/verified-signup", async (req, res) => {
  
  const data = req.body; 

  const parseResult = signUpSchema.safeParse(data);

  if(!parseResult.success){
    res.status(400).send({
      message : "Invalid Credentials"
    });
    return;
  }

  const {firstName, lastName, email, password, passcode, } = data;

  const isValid = await validateCode({ code: passcode, email });
  if(!isValid){
    return res.status(400).send({ message: "Invalid PassCode" });
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  try {
    const result = await pool.query(signUpQuery, [
      email,
      hashedPassword,
      firstName,
      lastName
    ]);

    const user = result.rows[0];

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        firstName : user.firstName
      },
      secret,
      { expiresIn: "7d" }
    );

    return res.status(200).send({
      token : token,
      message : "Data is being Stored Successfully!"
    })
  } catch (error) {
    console.log(error)
    return res.status(500).send({
      message : "Unable to Store User To Database!"
    })
  }
})

app.post("/login", async (req, res) => {
  const data = req.body;
  const parseResult = signInSchema.safeParse(data);
  if (!parseResult.success) {
    return res.status(400).send({
      message: "Invalid credentials"
    });
  }


  const { email, password } = parseResult.data;

  const result = await pool.query(loginQuery, [email])

  if (result.rows.length === 0) {
    return res.status(401).send({
      message: "Invalid email or password"
    });
  }

  const hashedPass = result.rows[0].password;
  const userId = result.rows[0].id;

  const verfication = await bcrypt.compare(password, hashedPass);

  if (!verfication) {
    return res.status(401).send({
      message: "Invalid email or password"
    });
  }

  const token = jwt.sign(
    {
      userId: userId,
      email: email, 
      firstName : result.rows[0].firstName
    },
    secret,
    { expiresIn: "7d" }
  );


  res.status(200).send({
    token : token,
    message : "It's Good To See You Again!"
  })
})


app.post("/createInstance", verifyToken, async (req, res) => {
  const { userId, name } = req.user!;

  try {
    const { username, status, containerId, assignedPort, redisPassword } = await createInstance({ userId, userName : name })

    if(status != 200){
      return res.status(status).send({
        message : "Error While Creating Instance"
      })
    }

    const saving = await pool.query(createInstanceQuery, [containerId, assignedPort, redisPassword, userId]);

    const { id, port, password, instanceUSER } = saving.rows[0]
    
    return res.status(200).send({
      data : {
        id, port, username, password, instanceUSER
      },
      message : "Redis Instance Has Been Saved Successfully!"
    })

  } catch (error) {
    console.log( "Erro While Creating a Job:- " + error)
    return res.status(500).send({
      message : "Internal Server Error!"
    })
  }
})


app.get("/used-instance", async (req, res) => {
  try {
    const active_data = await pool.query(fetchActives);

    const active_instances = active_data.rows;

    res.status(200).send({
      message : "Active Instances Fetched Successfully.",
      instance : active_instances
    })
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message : "Error While Fetching Active Instances"
    })
  }
})

app.get("/fetch-instances", verifyToken, async (req, res) => {
  const userId  = req.user?.userId;

  try {
    const data = await pool.query(fetchInstances, [userId]);
    const containers = data.rows;

    let instances: instance[] = [];

    containers.forEach((container) => {
      instances.push({
        port: container.port,
        status: container.status,
        date: container.createdat
      });
    });

    res.status(200).send({
      message: "Fetched Instances Successfully!",
      instances
    });

  } catch (error) {
    console.error(error)
    res.status(500).send({
      message : "Error While Fetching Instances"
    })
  }
})