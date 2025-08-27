export default function Hello(app) {
app.get('/hello', (req, res) => {res.send('Life is fucked!')});
app.get('/', (req,res) => {res.send('Welcome the Web Development!')})
}