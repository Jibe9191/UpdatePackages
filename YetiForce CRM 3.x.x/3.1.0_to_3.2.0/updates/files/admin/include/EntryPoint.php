<?php
/* +**********************************************************************************
 * The contents of this file are subject to the vtiger CRM Public License Version 1.1
 * ("License"); You may not use this file except in compliance with the License
 * The Original Code is:  vtiger CRM Open Source
 * The Initial Developer of the Original Code is vtiger.
 * Portions created by vtiger are Copyright (C) vtiger.
 * All Rights Reserved.
 * ********************************************************************************** */
vimport('include.http.Request');
vimport('include.http.Response');
vimport('include.http.Session');

vimport('include.runtime.Globals');
vimport('include.runtime.Controller');
vimport('admin.include.Viewer');
vimport('include.runtime.Theme');
vimport('include.runtime.BaseModel');
vimport('include.runtime.JavaScript');

vimport('include.runtime.LanguageHandler');
vimport('include.runtime.Cache');

abstract class Admin_EntryPoint
{

	/**
	 * Login data
	 */
	protected $login = false;

	/**
	 * Get login data.
	 */
	function getLogin()
	{
		return $this->login;
	}

	/**
	 * Set login data.
	 */
	function setLogin($login)
	{
		if ($this->login)
			throw new \Exception\AppException('Login is already set.');
		$this->login = $login;
	}

	/**
	 * Check if login data is present.
	 */
	function hasLogin()
	{
		return $this->getLogin() ? true : false;
	}

	abstract function process(Vtiger_Request $request);
}
