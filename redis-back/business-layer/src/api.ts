import express from 'express';
import { z } from 'zod'
import { mailVarification } from './mail.js';
import { createInstance, deleteContainer, isPortAvailable, redisCommand } from "@redis/service/root/manager.js"
import { validateCode } from './db.js';
import type { Request, Response, NextFunction } from 'express';
import pool from './db/index.js';
import bcrypt from "bcrypt";
import type { JwtPayload } from 'jsonwebtoken'
import jwt from 'jsonwebtoken'
import cors from 'cors'
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
const admin_pass = process.env.ADMIN_PASS || ""

if (!secret) {
  throw new Error("JWT_SECRET not defined");
}

if (!saltRounds || isNaN(saltRounds)) {
  throw new Error("Invalid bcrypt salt rounds");
}



app.use(express.json());
app.use(cors())

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
    return res.status(401).send({ 
      message: "No token provided", 
      description: "Guess who's gonna lose their job today? Our frontend intern. They forgot to send the token! 🥳" 
    });

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ 
      message: "No token provided", 
      description: "Guess who's gonna lose their job today? Our frontend intern. They forgot to send the token! 🥳" 
    });
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
        message: "Invalid email or password",
        description : "Whoa there! I don't recognize your face (or your token). You're trying to get into the VIP lounge with a library card. Go back to login before the bouncers notice."
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.firstName
    };

    next();
  } catch (err) {
    return res.status(500).send({ message: "Invalid token", description : "Smells like our server is leaking! (Backstage: Saish! Bring some duct tape and a bucket, the middleware is dripping again!)" });
  }
}

app.post("/signup", async (req, res) => {
    const data = req.body; 
    const parseResult = mailSchema.safeParse(data);
    console.log(data)

    if(!parseResult.success){
      res.status(400).send({
        message : "Invalid Credentials",
        description : "Come on, it's a single email field. Even a keyboard-smashing cat could get closer than this."
      });
      return;
    }
    
    const {email} = data;
    const existing = await pool.query(isUserExistByEmail, [email]);

    if (existing.rows.length > 0) {
      return res.status(409).send({
        message: "User already exists",
        description : "Wait... haven't we met before? Your email is already in my database. Either you have a twin, or you’re already signed up. Try logging in instead!"
      });
    }

    const mailState = await mailVarification(email);

    if(mailState.status == "error-mail"){
      return res.status(400).send({
        message : "Error While Sending Code, Please Try Later or use different email",
        description : "The carrier pigeon carrying your verification code got distracted by breadcrumbs. Try again, or use an email that doesn't scare my mail server."
      })
    }

    return res.status(200).send({
      message : "Code is Being Shared To Your email Please Check!"
    })
    
})

app.post("/verified-signup", async (req, res) => {
  
  const data = req.body; 

  const parseResult = signUpSchema.safeParse(data);

  if(!parseResult.success){
    res.status(400).send({
      message : "Invalid Credentials",
      description : "In case you don't know that i will tell you that you can also use your documents to fill these fields."
    });
    return;
  }

  const {firstName, lastName, email, password, passcode, } = data;

  const isValid = await validateCode({ code: passcode, email });
  if(!isValid){
    return res.status(400).send({ message: "Invalid PassCode", description : "Either you messed up the passcode or we sent it to Mama Coco. Check your inbox again, carefully this time!" });
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
      message : "Unable to Store User To Database!",
      description : "The server is showing some attitude and refusing to store your data. (Backstage: Hey Intern, tell Saish to grab a slipper. Let’s give this server some 'Asian treatment'.)"
    })
  }
})

app.post("/login", async (req, res) => {
  const data = req.body;
  const parseResult = signInSchema.safeParse(data);
  if (!parseResult.success) {
    return res.status(400).send({
      message: "Invalid credentials",
      description : "Are we having an identity crisis? Try to remember which version of you created this account. Should I play Taylor Swift or Phonk for you to figure it out?"
    });
  }


  const { email, password } = parseResult.data;

  const result = await pool.query(loginQuery, [email])

  if (result.rows.length === 0) {
    return res.status(401).send({
      message: "Invalid email or password",
      description : "Are we having an identity crisis? Try to remember which version of you created this account. Should I play Taylor Swift or Phonk while you to figure it out?"
    });
  }

  const hashedPass = result.rows[0].password;
  const userId = result.rows[0].id;

  const verfication = await bcrypt.compare(password, hashedPass);

  if (!verfication) {
    return res.status(401).send({
      message: "Invalid email or password",
      description : "Are we having an identity crisis? Try to remember which version of you created this account. Should I play Taylor Swift or Phonk while you to figure it out?"
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
  const { userId, email } = req.user!;

  try {
    const { username, status, containerId, assignedPort, redisPassword, overhead } = await createInstance({ userId, userMail : email })
    console.log(status)
    if(status == 403){
      return res.status(403).send({
        message : "You Can Have At Max One Instance Per Account",
        description : "Easy there, big spender! One free instance is the limit. My server is running on a prayer and half a potato—don't push your luck."
      })
    }

    if(status != 200){
      return res.status(status).send({
        message : "Error While Creating Instance"
      })
    }

    const saving = await pool.query(createInstanceQuery, [containerId, assignedPort, redisPassword, userId, overhead]);

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
      message : "Internal Server Error!",
      description : "The container manager failed to start. Saish has motion sickness and we sent him inside a giant fish (I think they call it 'Docker')."
    })
  }
})


app.get("/used-instances", async (req, res) => {
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
      message : "Error While Fetching Active Instances",
      description: "Elephants are the cutest animals in the world and usually very playful—unlike our elephant, Postgres. He's currently being rude and refusing to fetch your data. (Backstage: Is Saish there? Tell him the elephant is acting up again. Should we replace him with a Dolphin or a Leaf?)"
    })
  }
})

app.post("/custom-instance", verifyToken, async(req, res) => {
  const { userId, email } = req.user!;
  const { port } = req.body;
  const isValidPort = await isPortAvailable(port);

  console.log("Request For Custom Instance By " + email + ", for port:- " + port)

  if(!isValidPort){
    return res.status(409).send({
      message : "Port Already Occupied",
      description : "This port already has a roommate. They aren't looking for a third."
    })
  }
  const customePort = port;
  try {
    const { username, status, containerId, assignedPort, redisPassword, overhead } = await createInstance({ userId, userMail : email, userPort : customePort })
    console.log(status)
    if(status == 403){
      return res.status(403).send({
        message : "You Can Have At Max One Instance Per Account",
        description : "Easy there, big spender! One free instance is the limit. My server is running on a prayer and half a potato—don't push your luck."
      })
    }

    if(status != 200){
      return res.status(status).send({
        message : "Error While Creating Instance"
      })
    }

    const saving = await pool.query(createInstanceQuery, [containerId, assignedPort, redisPassword, userId, overhead]);

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
      message : "Internal Server Error!",
      description : "The container manager failed to start. Saish has motion sickness and we sent him inside a giant fish (I think they call it 'Docker')."
    })
  }
})

app.delete("/delete-instance", verifyToken, async (req, res) => {
  const { userId } = req.user!;
  const { instanceId } = req.body;
  
  if (!instanceId) {
    return res.status(400).json({
      message: "instanceId is required",
      description: "Holy Moly, we don't know what to delete. I guess our frontend team is in the garden touching grass again."
    });
  }
  
  try {
    const privilege = await pool.query(
      "SELECT instanceUSER, containerId FROM instances WHERE id = $1 AND status = 'RUNNING'", 
      [instanceId]
    );

    if (privilege.rows.length === 0) {
       return res.status(404).send({
         message: "Unable to Find the Instance",
         description: "Either this Instance does not exist or we sent it to Antarctica to the penguin who is motivating some kids on social media these days."
       });
    }

    const privilegeUser = privilege.rows[0].instanceuser;
    const containerId = privilege.rows[0].containerid;

    if (userId != privilegeUser) {
      return res.status(403).send({
        message: "Access Denied",
        description: "HEY! Why are you touching someone else's container? (Backstage: Saish! Lock the door! Someone's trying to break in!)"
      });
    }

    await deleteContainer(containerId);
    await pool.query("UPDATE instances SET status = 'STOPPED' WHERE id = $1", [instanceId]);

    res.status(200).send({ message: "Instance has been deleted successfully." });
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      description: "I guess there is something wrong from our side. (What, were you expecting a joke? This is serious business!)"
    });
  }
});

app.get("/instance-data", verifyToken, async (req, res) => {
  const { containerId } = req.body;

  try {
    const val = await pool.query("SELECT containerId FROM instances WHERE id = $1", [containerId]);
    
    if (val.rows.length === 0) {
      return res.status(404).send({
        message: "Instance not found",
        description: "I looked everywhere—under the rug, behind the server rack, even in Saish's lunchbox. This instance doesn't exist."
      });
    }

    const instanceId = val.rows[0].containerid;
    const data = await redisCommand(instanceId, admin_pass, ["INFO", "memory"]);
    
    res.status(200).send({ data });
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      description: "Saish accidentally plugged the Redis cable into the coffee machine. We're drying it off now."
    });
  }
});

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
      message : "Error While Fetching Instances",
      description : "Oh no. Something behind the scenes just tripped over a power cord. Our servers are currently having a minor identity crisis and think they're toasters. I’m giving them a pep talk and some virtual coffee right now. Refresh the page in a second and act like this never happened!(Backstage: Wait, is the mic still on? I hope the user is gone... Shut off the connection! Saish? Saish!! Get off LeetCode and fix the API! The database is making popcorn noises again and I don't see any corn!)"
    })
  }
})