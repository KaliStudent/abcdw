
const redirects = {
  demo: "https://example.com" // 👈 Replace with your actual demo destination
};

export default function handler(req, res) {
  const { code } = req.query;
  const target = redirects[code];

  if (target) {
    res.writeHead(301, { Location: target });
    res.end();
  } else {
    res.status(404).send("Not found");
  }
}
