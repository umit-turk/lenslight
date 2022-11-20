import mongoose from "mongoose";

const conn = () => {
    mongoose.connect(process.env.DB_URI, {
        dbName:"lenslight",
        useNewUrlParser:true,
        useUnifiedTopology:true,
    }).then(() => {
        console.log("Connected to the DB successfuly")
    }).catch((err) => {
        console.log(`Db connection err:${err}`);
    })
}

export default conn;