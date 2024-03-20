const axios = require('axios');
try {
  const formData = {
    user: '1'
  };
  const formBody = querystring.stringify(formData);
  request = await axios.post(
    'https://ngx.ampath.or.ke/amrs-id-generator/generateidentifier',
    formBody
  );
} catch (error) {
  reply.response('Internal Server Error').code(500);
}
