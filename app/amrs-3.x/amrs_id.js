const axios = require('axios');
try {
  console.error('Tuko Hapa:');
  const formData = {
    user: '1'
  };
  const formBody = querystring.stringify(formData);
  request = await axios.post(
    'https://ngx.ampath.or.ke/amrs-id-generator/generateidentifier',
    formBody
  );

  // const responseData = response.data;
  // reply.response(response.data);
} catch (error) {
  // Handle errors
  console.error('Error:', error.message);
  reply.response('Internal Server Error').code(500);
}
