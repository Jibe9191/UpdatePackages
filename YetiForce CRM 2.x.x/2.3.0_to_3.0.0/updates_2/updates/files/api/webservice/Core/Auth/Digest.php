<?php

/**
 * Digest Authorization class
 * @package YetiForce.WebserviceAuth
 * @license licenses/License.html
 * @author Mariusz Krzaczkowski <m.krzaczkowski@yetiforce.com>
 */
class DigestAuth extends AbstractAuth
{

	function authenticate()
	{
		$userpass = $this->getCredentials();
		if (!$userpass) {
			$auth->requireLogin();
			throw new APIException('No basic authentication headers were found', 401);
		}

		// Authenticates the user
		if (!$this->validateUserPass($userpass[0], $userpass[1])) {
			$auth->requireLogin();
			throw new APIException('Username or password does not match', 401);
		}
		$this->currentUser = $userpass[0];
		return true;
	}

	function getCredentials()
	{
		$auth = $this->api->request->getHeader('Authorization');

		if (!$auth) {
			return null;
		}
		if (strtolower(substr($auth, 0, 6)) !== 'basic ') {
			return null;
		}
		return explode(':', base64_decode(substr($auth, 6)), 2);
	}

	function requireLogin()
	{
		$this->api->response->addHeader('WWW-Authenticate', 'Basic realm="' . $this->realm . '"');
		$this->api->response->setStatus(401);
	}

	function getDigestHash($realm, $username)
	{
		$stmt = $this->pdo->prepare('SELECT digesta1 FROM ' . $this->tableName . ' WHERE username = ?');
		$stmt->execute([$username]);
		return $stmt->fetchColumn() ? : null;
	}
}
