<?php

class foto {

	private $fullPathFilename; 
	private $xsrfToken; 
	private $mpSessionID;

	/* HTTP request header fields */
	const USER_AGENT      = 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36';
	const HOST            = 'www.marktplaats.nl';
	const REFERER         = 'https://www.marktplaats.nl/syi/1/2/plaatsAdvertentie.html?bucket=1&origin=HEADER';
	const CONTENT_TYPE    = 'multipart/form-data';
	const ACCEPT          = '*/*';
	const ACCEPT_ENCODING = 'gzip,deflate,sdch';
	const ACCEPT_LANGUAGE = 'nl-NL,nl;q=0.8,en-US;q=0.6,en;q=0.4';
	const CONNECTION      = 'Closed';

	/* Upload url */
	const UPLOAD_IMG_URL  = 'https://www.marktplaats.nl/syi/uploadImage.html?nl.marktplaats.xsrf.token=';

	function __construct($fullPathFilename, $xsrfToken, $mpSessionID)
	{ 
		$this->fullPathFilename = $fullPathFilename;
		$this->xsrfToken = $xsrfToken;
		$this->mpSessionID = $mpSessionID;
	} 

	/**
	 * Generates an unique ID.
	 *
	 * Based on: Moxiecode    https://github.com/moxiecode/moxie/blob/master/src/javascript/core/utils/Basic.js:guid()
	 *           Plupload     https://github.com/moxiecode/plupload/blob/master/js/moxie.js:guid()
	 *           Redmine_dmsf https://code.google.com/p/redmine-dmsf/source/browse/trunk/redmine_dmsf/assets/javascripts/plupload/plupload.js:guid()
	 *
	 * @method guid
	 * @return {String} Virtually unique id.
	 */
	private function guid() {

		function jsRandom () {
		   return (float)rand()/(float)getrandmax();
		}

		$msec = floor(microtime(true)*1000);
		$guid = base_convert($msec, 10, 32);

		for ($i = 0; $i < 5; $i++) {
			$guid .= base_convert(floor(jsRandom() * 65535), 10, 32);
		}
		return 'p' . $guid;
	}

	private function getRequestHeaders($guid, $mpSessionID) {
		$headers = array(
		      'Host: '.self::HOST, 
		      'Connection: '.self::CONNECTION, 
		      'Origin: https://'.self::HOST, 
		      'User-Agent: '.self::USER_AGENT,
		      'Content-Type: '.self::CONTENT_TYPE.'; '.'boundary=----pluploadboundary'.$guid,
		      'Accept: '.self::ACCEPT,
		      'Referer: '.self::REFERER,
		      'Accept-Encoding: '.self::ACCEPT_ENCODING,
		      'Accept-Language: '.self::ACCEPT_LANGUAGE,
		      'Cookie: MpSession='.$mpSessionID.';'
		);
		return $headers;
	}

	public function voegFotoToe() {

		$url      = self::UPLOAD_IMG_URL.$this->xsrfToken;
		$guid     = $this->guid();

		$filename = basename($this->fullPathFilename);
		$handle   = fopen($this->fullPathFilename, "r");

		$data     = '------pluploadboundary'.$guid."\r\n";
		$data    .= 'Content-Disposition: form-data; name="name"'."\r\n";
		$data    .= "\r\n";
		$data    .= $filename."\r\n";
		$data    .= '------pluploadboundary'.$guid."\r\n";
		$data    .= 'Content-Disposition: form-data; name="imageData"; filename="'.$filename.'"'."\r\n";
		$data    .= 'Content-Type: image/jpeg'."\r\n\r\n";
		$data    .= fread($handle, filesize($this->fullPathFilename));
		$data    .= "\r\n".'------pluploadboundary'.$guid."--\r\n";

		$params = array('http' => array(
			  'method' => 'POST',
			  'protocol_version' => 1.1,
			  //'proxy' => "tcp://localhost:8888",
			  'timeout' => 5,
			  'content' => $data
			  ));

		$params['http']['header'] = $this->getRequestHeaders($guid, $this->mpSessionID);
		$ctx = stream_context_create($params);

		$fp = fopen($url, 'rb', false, $ctx);
		if (!$fp) {
		  throw new Exception("Problem with $url, $php_errormsg");
		}

		$response = stream_get_contents($fp);
		if ($response === false) {
		  throw new Exception("Problem reading data from $url, $php_errormsg");
		}

		$meta = stream_get_meta_data($fp);
		if ($meta === false) {
		  throw new Exception("Problem reading meta data from $url, $php_errormsg");
		}

		/* Content-Encoding: gzip */
		if (!empty(preg_grep("/content-encoding.*gzip/i", $meta["wrapper_data"]))) {
			
		      // Gzip header ID1 and ID2 (rfc1952)
		      if(ord($response[0]) == 0x1f && ord($response[1]) == 0x8b)
		      {
			$response = gzinflate(substr($response,10));
		      }
		}
		return $response;
	}
}

$fullPathFilename = $_POST["picturePath"];
$xsrfToken        = $_POST["xsrfToken"];
$mpSessionID      = $_POST["mpSessionID"];

/*
$fp = fopen('voegfototoelog.txt', 'a');
fwrite($fp, "\n");
fwrite($fp, "START:");
fwrite($fp, date('d-m-Y H:i:s'));
fclose($fp);
 */

$foto = new foto($fullPathFilename, $xsrfToken, $mpSessionID);
$result = $foto->voegFotoToe();

/*
$fp = fopen('voegfototoelog.txt', 'a');
fwrite($fp, "\n");
fwrite($fp, "STOP:");
fwrite($fp, date('d-m-Y H:i:s'));
fwrite($fp, print_r($result, TRUE));
fwrite($fp, "^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
fwrite($fp, "\n\n");
fclose($fp);
*/

/* result example:

stdClass Object
(
    [requestToken] => 1406066157454.8842279137f15751519c196110bcbefa
    [valid] => 1
    [messageKey] => 
    [id] => 2357935873
    [imageUrl] => //i.marktplaats.com/00/s/MzE3WDM4MA==/z/K2IAAOSwiuZTzt3w/$_82.JPG
    [largeImageUrl] => //i.marktplaats.com/00/s/MzE3WDM4MA==/z/K2IAAOSwiuZTzt3w/$_84.JPG
    [extraLargeImageUrl] => //i.marktplaats.com/00/s/MzE3WDM4MA==/z/K2IAAOSwiuZTzt3w/$_85.JPG
)
*/

echo $result;

?>
