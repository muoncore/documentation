<?php
include 'contact_config.php';
error_reporting (E_ALL ^ E_NOTICE);
$post = (!empty($_POST)) ? true : false;
if($post)
{
    include 'functions.php';
    
    $name = stripslashes($_POST['name']);
    $email = $_POST['email'];
    $subject = stripslashes($_POST['subject']);
    $message = 'Name: ' . $name . "\r\n"  . stripslashes($_POST['message']);
    $error = array();
    // Check name
    if(!$name)
    {
        $error[] = 'Please enter your name.';
    }
    
    // Check email
    if(!$email)
    {
        $error[] = 'Please enter an e-mail address.';
    }
    
    if($email && !ValidateEmail($email))
    {
        $error[] = 'Please enter a valid e-mail address.';
    }
    
    // Check message (length)
    if(!$message || strlen($message) < 15)
    {
        $error[] = "Please enter your message. It should have at least 15 characters.";
    }
    
    if(!$error)
    {
        $headers = 'From: '. $email . "\r\n" .
            'Reply-To: '. $email . "\r\n" .
            'X-Mailer: PHP/' . phpversion();
            
        $mail = mail(WEBMASTER_EMAIL, $subject, $message, $headers);
        
        if($mail)
        {
            echo json_encode(array('status' => 'OK'));
        }
        else
        {
            echo json_encode(array('status' => 'error', 'text' => array('Error')));
        }
    }
    else
    {
        echo json_encode(array('status' => 'error', 'text' => $error));
    }
}
?>